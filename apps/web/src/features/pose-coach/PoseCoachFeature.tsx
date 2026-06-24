import type { CoachReview, PhoneCameraSession, WorkoutSession } from "@shorir/contracts";
import { Camera, CircleStop, Loader2, RefreshCw, Save, ScanLine, ShieldAlert, Smartphone, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppServices } from "../../app/providers";
import { ensureProfileId as ensureBrowserProfileId } from "../../app/profileSession";
import type { PoseFrame, PoseLandmark } from "../../ports/poseEstimator";
import { phoneCameraRtcConfiguration, serializeCandidate, serializeDescription } from "../phone-camera/webrtc";
import { AnimatedSquatCoach } from "./AnimatedSquatCoach";

type SquatPhase = "idle" | "standing_ready" | "descending" | "bottom" | "ascending";
type CameraMode = "local" | "phone" | null;
type PoseSource = HTMLVideoElement;
type CalibrationPhase = "idle" | "standing" | "depth" | "complete";

interface NormalizedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CalibrationProfile {
  region: NormalizedBox;
  standingAngle: number;
  depthAngle: number;
  referenceScale: number;
}

interface CalibrationSample {
  box: NormalizedBox;
  kneeAngle: number;
  bodyScale: number;
}

interface SquatMetrics {
  confidence: number;
  kneeAngle: number | null;
  phase: SquatPhase;
  reps: number;
  feedback: string;
}

const initialMetrics: SquatMetrics = {
  confidence: 0,
  kneeAngle: null,
  phase: "idle",
  reps: 0,
  feedback: "Stand side-on, keep your full body in frame, then start tracking."
};

const poseConnections = [
  ["left_shoulder", "left_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_shoulder", "right_hip"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_shoulder", "right_shoulder"],
  ["left_hip", "right_hip"]
] as const;

function landmarkByName(frame: PoseFrame, name: string) {
  return frame.landmarks.find((landmark) => landmark.name === name) ?? null;
}

function averageConfidence(landmarks: Array<PoseLandmark | null>) {
  const available = landmarks.filter((landmark): landmark is PoseLandmark => Boolean(landmark));
  if (available.length === 0) {
    return 0;
  }
  return available.reduce((total, landmark) => total + landmark.confidence, 0) / available.length;
}

function angleDegrees(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLength = Math.hypot(ab.x, ab.y);
  const cbLength = Math.hypot(cb.x, cb.y);
  if (abLength === 0 || cbLength === 0) {
    return null;
  }
  const cosine = Math.min(1, Math.max(-1, dot / (abLength * cbLength)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

function landmarkDistance(a: PoseLandmark, b: PoseLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function bodyScale(side: ReturnType<typeof chooseSide>) {
  if (!side.shoulder || !side.hip || !side.knee || !side.ankle) {
    return null;
  }
  return (
    landmarkDistance(side.shoulder, side.hip) +
    landmarkDistance(side.hip, side.knee) +
    landmarkDistance(side.knee, side.ankle)
  );
}

function chooseSide(frame: PoseFrame) {
  const left = {
    shoulder: landmarkByName(frame, "left_shoulder"),
    hip: landmarkByName(frame, "left_hip"),
    knee: landmarkByName(frame, "left_knee"),
    ankle: landmarkByName(frame, "left_ankle")
  };
  const right = {
    shoulder: landmarkByName(frame, "right_shoulder"),
    hip: landmarkByName(frame, "right_hip"),
    knee: landmarkByName(frame, "right_knee"),
    ankle: landmarkByName(frame, "right_ankle")
  };
  const leftConfidence = averageConfidence([left.shoulder, left.hip, left.knee, left.ankle]);
  const rightConfidence = averageConfidence([right.shoulder, right.hip, right.knee, right.ankle]);

  return rightConfidence > leftConfidence
    ? { ...right, confidence: rightConfidence }
    : { ...left, confidence: leftConfidence };
}

function sourceDimensions(source: PoseSource) {
  return { width: source.videoWidth, height: source.videoHeight };
}

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function poseBox(frame: PoseFrame): NormalizedBox | null {
  const landmarks = frame.landmarks.filter((landmark) => landmark.confidence >= 0.55);
  if (landmarks.length < 8) {
    return null;
  }
  const xs = landmarks.map((landmark) => landmark.x);
  const ys = landmarks.map((landmark) => landmark.y);
  const x = clamp(Math.min(...xs));
  const y = clamp(Math.min(...ys));
  return {
    x,
    y,
    width: clamp(Math.max(...xs) - x),
    height: clamp(Math.max(...ys) - y)
  };
}

function averageSample(samples: CalibrationSample[]) {
  const total = samples.reduce(
    (result, sample) => ({
      x: result.x + sample.box.x,
      y: result.y + sample.box.y,
      width: result.width + sample.box.width,
      height: result.height + sample.box.height,
      angle: result.angle + sample.kneeAngle,
      bodyScale: result.bodyScale + sample.bodyScale
    }),
    { x: 0, y: 0, width: 0, height: 0, angle: 0, bodyScale: 0 }
  );
  const count = Math.max(1, samples.length);
  return {
    box: {
      x: total.x / count,
      y: total.y / count,
      width: total.width / count,
      height: total.height / count
    },
    angle: total.angle / count,
    bodyScale: total.bodyScale / count
  };
}

function activityRegion(boxes: NormalizedBox[]): NormalizedBox {
  const left = Math.min(...boxes.map((box) => box.x));
  const top = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  const width = right - left;
  const height = bottom - top;
  const x = clamp(left - width * 0.24);
  const y = clamp(top - height * 0.08);
  return {
    x,
    y,
    width: Math.min(1 - x, width * 1.48),
    height: Math.min(1 - y, height * 1.14)
  };
}

function boxInsideRegion(box: NormalizedBox, region: NormalizedBox) {
  const tolerance = 0.025;
  return (
    box.x >= region.x - tolerance &&
    box.y >= region.y - tolerance &&
    box.x + box.width <= region.x + region.width + tolerance &&
    box.y + box.height <= region.y + region.height + tolerance
  );
}

function boxStyle(box: NormalizedBox, mirrored: boolean) {
  const displayX = mirrored ? 1 - box.x - box.width : box.x;
  return {
    left: `${displayX * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`
  };
}

function drawPose(canvas: HTMLCanvasElement | null, source: PoseSource | null, frame: PoseFrame) {
  if (!canvas || !source) {
    return;
  }

  const { width, height } = sourceDimensions(source);
  if (width === 0 || height === 0) {
    return;
  }

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineWidth = 5;
  context.strokeStyle = "rgba(0, 210, 255, 0.88)";
  context.fillStyle = "#fff8ea";

  for (const [fromName, toName] of poseConnections) {
    const from = landmarkByName(frame, fromName);
    const to = landmarkByName(frame, toName);
    if (!from || !to || from.confidence < 0.45 || to.confidence < 0.45) {
      continue;
    }
    context.beginPath();
    context.moveTo(from.x * canvas.width, from.y * canvas.height);
    context.lineTo(to.x * canvas.width, to.y * canvas.height);
    context.stroke();
  }

  for (const landmark of frame.landmarks) {
    if (landmark.confidence < 0.45) {
      continue;
    }
    context.beginPath();
    context.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
    context.fill();
  }
}

export function PoseCoachFeature() {
  const { apiClient, poseEstimator } = useAppServices();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeSourceRef = useRef<PoseSource | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const phonePeerRef = useRef<RTCPeerConnection | null>(null);
  const phoneSignalPollRef = useRef<number | null>(null);
  const phoneSignalBusyRef = useRef(false);
  const phoneCandidatesRef = useRef(new Set<string>());
  const phoneTrackingStartedRef = useRef(false);
  const iceRestartingRef = useRef(false);
  const phaseRef = useRef<SquatPhase>("idle");
  const repsRef = useRef(0);
  const confidenceSamplesRef = useRef<number[]>([]);
  const startedAtRef = useRef<Date | null>(null);
  const profileIdRef = useRef<string | null>(null);
  const calibrationPhaseRef = useRef<CalibrationPhase>("idle");
  const calibrationProfileRef = useRef<CalibrationProfile | null>(null);
  const standingSamplesRef = useRef<CalibrationSample[]>([]);
  const calibrationBoxesRef = useRef<NormalizedBox[]>([]);
  const minimumDepthAngleRef = useRef<number | null>(null);
  const [metrics, setMetrics] = useState<SquatMetrics>(initialMetrics);
  const [isTracking, setIsTracking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [phoneSession, setPhoneSession] = useState<PhoneCameraSession | null>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [phoneBaseUrl, setPhoneBaseUrl] = useState(() => window.location.origin);
  const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>("idle");
  const [calibrationProfile, setCalibrationProfile] = useState<CalibrationProfile | null>(null);
  const [livePoseBox, setLivePoseBox] = useState<NormalizedBox | null>(null);
  const [regionValid, setRegionValid] = useState(false);
  const [distanceStatus, setDistanceStatus] = useState<"unknown" | "close" | "good" | "far">("unknown");
  const [error, setError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const [coachReview, setCoachReview] = useState<CoachReview | null>(null);

  const statusTone = useMemo(() => {
    if (error) {
      return "warning";
    }
    if (isTracking) {
      return "success";
    }
    return "neutral";
  }, [error, isTracking]);

  const phoneCameraUrl = useMemo(() => {
    if (!phoneSession) {
      return "";
    }
    return `${phoneBaseUrl.trim().replace(/\/$/, "")}/phone-camera/${phoneSession.id}`;
  }, [phoneBaseUrl, phoneSession]);

  const displayedActivityRegion = useMemo(() => {
    if (calibrationProfile) {
      return calibrationProfile.region;
    }
    if (calibrationPhase === "standing" || calibrationPhase === "depth") {
      return { x: 0.16, y: 0.05, width: 0.68, height: 0.9 };
    }
    return null;
  }, [calibrationPhase, calibrationProfile]);

  const resetSessionState = useCallback(() => {
    phaseRef.current = "idle";
    repsRef.current = 0;
    confidenceSamplesRef.current = [];
    startedAtRef.current = new Date();
    setSavedSession(null);
    setCoachReview(null);
    setMetrics({
      ...initialMetrics,
      feedback: "Tracking is active. Stand tall once, then start a controlled squat."
    });
  }, []);

  const beginCalibration = useCallback(() => {
    calibrationPhaseRef.current = "standing";
    calibrationProfileRef.current = null;
    standingSamplesRef.current = [];
    calibrationBoxesRef.current = [];
    minimumDepthAngleRef.current = null;
    confidenceSamplesRef.current = [];
    phaseRef.current = "idle";
    repsRef.current = 0;
    setSavedSession(null);
    setCoachReview(null);
    setCalibrationPhase("standing");
    setCalibrationProfile(null);
    setRegionValid(false);
    setDistanceStatus("unknown");
    setMetrics({
      ...initialMetrics,
      feedback: "Calibration: stand tall and still with your full body visible."
    });
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopPhoneConnection = useCallback(() => {
    if (phoneSignalPollRef.current !== null) {
      window.clearInterval(phoneSignalPollRef.current);
      phoneSignalPollRef.current = null;
    }
    phonePeerRef.current?.close();
    phonePeerRef.current = null;
    phoneSignalBusyRef.current = false;
    phoneCandidatesRef.current.clear();
    phoneTrackingStartedRef.current = false;
    iceRestartingRef.current = false;
  }, []);

  const handlePose = useCallback((frame: PoseFrame) => {
    drawPose(canvasRef.current, activeSourceRef.current, frame);
    const side = chooseSide(frame);
    const box = poseBox(frame);
    const currentBodyScale = bodyScale(side);
    setLivePoseBox(box);
    const kneeAngle =
      side.hip && side.knee && side.ankle ? angleDegrees(side.hip, side.knee, side.ankle) : null;
    const confidence = Math.min(frame.confidence, side.confidence);
    confidenceSamplesRef.current.push(confidence);
    if (confidenceSamplesRef.current.length > 900) {
      confidenceSamplesRef.current.shift();
    }

    if (confidence < 0.55 || kneeAngle === null) {
      setMetrics({
        confidence,
        kneeAngle,
        phase: phaseRef.current,
        reps: repsRef.current,
        feedback: "Cannot assess confidently. Step back and keep shoulder, hip, knee, and ankle visible."
      });
      return;
    }

    const calibrationStep = calibrationPhaseRef.current;
    if (calibrationStep === "standing") {
      if (!box || !currentBodyScale || box.height < 0.34 || kneeAngle < 145) {
        setMetrics({
          confidence,
          kneeAngle,
          phase: "idle",
          reps: 0,
          feedback: "Calibration: step back, stand tall, and keep your full body visible."
        });
        return;
      }
      standingSamplesRef.current.push({ box, kneeAngle, bodyScale: currentBodyScale });
      if (standingSamplesRef.current.length < 36) {
        setMetrics({
          confidence,
          kneeAngle,
          phase: "idle",
          reps: 0,
          feedback: `Calibration: hold still (${Math.round((standingSamplesRef.current.length / 36) * 100)}%).`
        });
        return;
      }
      const standing = averageSample(standingSamplesRef.current);
      calibrationBoxesRef.current = standingSamplesRef.current.map((sample) => sample.box);
      calibrationPhaseRef.current = "depth";
      setCalibrationPhase("depth");
      setMetrics({
        confidence,
        kneeAngle,
        phase: "idle",
        reps: 0,
        feedback: "Calibration: perform one comfortable squat, then stand tall."
      });
      return;
    }

    if (calibrationStep === "depth") {
      if (!box) {
        return;
      }
      calibrationBoxesRef.current.push(box);
      const standing = averageSample(standingSamplesRef.current);
      minimumDepthAngleRef.current = Math.min(minimumDepthAngleRef.current ?? kneeAngle, kneeAngle);
      const minimumAngle = minimumDepthAngleRef.current;
      const reachedDepth = minimumAngle <= standing.angle - 28;
      const returnedToStanding = kneeAngle >= standing.angle - 10;
      if (reachedDepth && returnedToStanding) {
        const profile: CalibrationProfile = {
          region: activityRegion(calibrationBoxesRef.current),
          standingAngle: Math.round(standing.angle),
          depthAngle: Math.round(minimumAngle),
          referenceScale: standing.bodyScale
        };
        calibrationProfileRef.current = profile;
        calibrationPhaseRef.current = "complete";
        setCalibrationProfile(profile);
        setCalibrationPhase("complete");
        phaseRef.current = "standing_ready";
        if (profileIdRef.current) {
          void apiClient.savePoseEvent({
            profileId: profileIdRef.current,
            eventType: "calibration_completed",
            metadata: {
              exercise: "squat",
              standingAngle: profile.standingAngle,
              depthAngle: profile.depthAngle,
              referenceScale: Number(profile.referenceScale.toFixed(4)),
              activityRegion: profile.region
            }
          });
        }
        setMetrics({
          confidence,
          kneeAngle,
          phase: "standing_ready",
          reps: 0,
          feedback: "Calibration complete. Stay inside the activity box and begin when ready."
        });
      } else {
        setMetrics({
          confidence,
          kneeAngle,
          phase: "idle",
          reps: 0,
          feedback: reachedDepth
            ? "Calibration: return to a tall standing position."
            : "Calibration: squat to a comfortable depth."
        });
      }
      return;
    }

    const profile = calibrationProfileRef.current;
    if (!profile || !box || !currentBodyScale) {
      setMetrics({
        confidence,
        kneeAngle,
        phase: phaseRef.current,
        reps: repsRef.current,
        feedback: "Calibrate the activity area before starting counted reps."
      });
      return;
    }

    const scaleRatio = currentBodyScale / profile.referenceScale;
    const insideRegion = boxInsideRegion(box, profile.region);
    const nextDistanceStatus = scaleRatio > 1.32 ? "close" : scaleRatio < 0.72 ? "far" : "good";
    setRegionValid(insideRegion);
    setDistanceStatus(nextDistanceStatus);

    if (!insideRegion) {
      setMetrics({
        confidence,
        kneeAngle,
        phase: phaseRef.current,
        reps: repsRef.current,
        feedback: "Move your full body back inside the calibrated activity box."
      });
      return;
    }
    if (nextDistanceStatus !== "good") {
      setMetrics({
        confidence,
        kneeAngle,
        phase: phaseRef.current,
        reps: repsRef.current,
        feedback:
          nextDistanceStatus === "close"
            ? "You are closer than calibration. Step slightly away from the camera."
            : "You are farther than calibration. Step slightly toward the camera."
      });
      return;
    }

    let nextPhase = phaseRef.current;
    let feedback = "Stand tall, then descend slowly.";
    const standingThreshold = profile.standingAngle - 9;
    const descentThreshold = profile.standingAngle - Math.max(18, (profile.standingAngle - profile.depthAngle) * 0.3);
    const bottomThreshold = profile.depthAngle + 8;
    const ascentThreshold = profile.depthAngle + 18;

    if (nextPhase === "idle" && kneeAngle > standingThreshold) {
      nextPhase = "standing_ready";
      feedback = "Ready. Start a slow squat when stable.";
    } else if (nextPhase === "standing_ready" && kneeAngle < descentThreshold) {
      nextPhase = "descending";
      feedback = "Descending. Keep your movement controlled.";
    } else if (nextPhase === "descending" && kneeAngle < bottomThreshold) {
      nextPhase = "bottom";
      feedback = "Good depth. Drive up smoothly.";
    } else if (nextPhase === "bottom" && kneeAngle > ascentThreshold) {
      nextPhase = "ascending";
      feedback = "Ascending. Keep knees tracking steadily.";
    } else if (nextPhase === "ascending" && kneeAngle > standingThreshold) {
      nextPhase = "standing_ready";
      repsRef.current += 1;
      feedback = "Rep counted. Reset tall before the next rep.";
    } else if (nextPhase === "descending" && kneeAngle > standingThreshold) {
      nextPhase = "standing_ready";
      feedback = "That rep was too shallow to count. Try a little more depth if comfortable.";
    }

    phaseRef.current = nextPhase;
    setMetrics({
      confidence,
      kneeAngle,
      phase: nextPhase,
      reps: repsRef.current,
      feedback
    });
  }, [apiClient]);

  useEffect(() => poseEstimator.onPose(handlePose), [handlePose, poseEstimator]);

  useEffect(
    () => () => {
      void poseEstimator.stop();
      stopCamera();
      stopPhoneConnection();
    },
    [poseEstimator, stopCamera, stopPhoneConnection]
  );

  async function ensureProfileId() {
    if (profileIdRef.current) {
      return profileIdRef.current;
    }
    const profileId = await ensureBrowserProfileId(apiClient);
    profileIdRef.current = profileId;
    return profileId;
  }

  async function setupPhonePeer(sessionId: string, profileId: string) {
    stopPhoneConnection();
    const peer = new RTCPeerConnection(phoneCameraRtcConfiguration());
    phonePeerRef.current = peer;
    peer.addTransceiver("video", { direction: "recvonly" });

    const publishOffer = async (iceRestart = false) => {
      phoneCandidatesRef.current.clear();
      const offer = await peer.createOffer({ iceRestart });
      await peer.setLocalDescription(offer);
      await apiClient.savePhoneCameraOffer(sessionId, serializeDescription(peer.localDescription!));
    };

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        void apiClient
          .addPhoneCameraIceCandidate(sessionId, {
            role: "coach",
            candidate: serializeCandidate(event.candidate)
          })
          .catch(() => setError("Unable to exchange network connection details."));
      }
    };

    peer.ontrack = (event) => {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      video.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      void video.play().then(async () => {
        if (phoneTrackingStartedRef.current) {
          return;
        }
        phoneTrackingStartedRef.current = true;
        activeSourceRef.current = video;
        await poseEstimator.load();
        await poseEstimator.start(video);
        await apiClient.savePoseEvent({
          profileId,
          eventType: "session_started",
          metadata: { exercise: "squat", source: "phone_webrtc" }
        });
        startedAtRef.current = new Date();
        setPhoneConnected(true);
        setIsTracking(true);
        beginCalibration();
      }).catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Unable to start the phone video.");
      });
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        iceRestartingRef.current = false;
        setPhoneConnected(true);
        setError(null);
      } else if (peer.connectionState === "disconnected") {
        setPhoneConnected(false);
      } else if (peer.connectionState === "failed" && !iceRestartingRef.current) {
        iceRestartingRef.current = true;
        setPhoneConnected(false);
        void publishOffer(true).catch(() => {
          iceRestartingRef.current = false;
          setError("The phone connection failed. Cancel and create a new connection.");
        });
      }
    };

    const poll = async () => {
      if (phoneSignalBusyRef.current) {
        return;
      }
      phoneSignalBusyRef.current = true;
      try {
        const signal = await apiClient.getPhoneCameraSignal(sessionId);
        setPhoneSession(signal.session);
        if (signal.session.status === "expired") {
          stopPhoneConnection();
          setError("The phone camera connection expired. Create a new QR code.");
          return;
        }
        if (signal.answer && peer.signalingState === "have-local-offer") {
          await peer.setRemoteDescription(signal.answer);
        }
        if (peer.remoteDescription) {
          for (const candidate of signal.phoneCandidates) {
            if (!phoneCandidatesRef.current.has(candidate.candidate)) {
              phoneCandidatesRef.current.add(candidate.candidate);
              await peer.addIceCandidate(candidate);
            }
          }
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to negotiate the phone camera connection.");
      } finally {
        phoneSignalBusyRef.current = false;
      }
    };

    await publishOffer();
    void poll();
    phoneSignalPollRef.current = window.setInterval(() => void poll(), 500);
  }

  async function startPhoneCamera() {
    setError(null);
    setIsBusy(true);
    try {
      await poseEstimator.stop();
      stopCamera();
      stopPhoneConnection();
      activeSourceRef.current = null;
      resetSessionState();
      setMetrics({
        ...initialMetrics,
        feedback: "Scan the QR code and start sharing from your phone. Tracking begins with the first frame."
      });
      setCameraMode("phone");
      setPhoneConnected(false);

      if (
        window.location.protocol !== "https:" &&
        ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ) {
        const tunnel = await apiClient.ensurePhoneCameraTunnel();
        setPhoneBaseUrl(tunnel.publicUrl);
      } else {
        setPhoneBaseUrl(window.location.origin);
      }

      const profileId = await ensureProfileId();
      const session = await apiClient.createPhoneCameraSession({ profileId });
      setPhoneSession(session);
      await setupPhonePeer(session.id, profileId);
    } catch (caught) {
      setCameraMode(null);
      setPhoneSession(null);
      setError(caught instanceof Error ? caught.message : "Unable to create a phone camera connection.");
    } finally {
      setIsBusy(false);
    }
  }

  async function startTracking() {
    setError(null);
    setIsBusy(true);
    try {
      stopPhoneConnection();
      setPhoneSession(null);
      setPhoneConnected(false);
      setCameraMode("local");
      resetSessionState();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element is unavailable.");
      }
      video.srcObject = stream;
      await video.play();
      activeSourceRef.current = video;
      await poseEstimator.load();
      await poseEstimator.start(video);

      const profileId = await ensureProfileId();
      await apiClient.savePoseEvent({
        profileId,
        eventType: "session_started",
        metadata: { exercise: "squat", source: "browser_pose" }
      });

      setIsTracking(true);
      beginCalibration();
    } catch (caught) {
      stopCamera();
      await poseEstimator.stop();
      activeSourceRef.current = null;
      setCameraMode(null);
      const cameraUnavailable =
        caught instanceof DOMException && ["NotFoundError", "NotReadableError"].includes(caught.name);
      if (cameraUnavailable) {
        setIsBusy(false);
        await startPhoneCamera();
        return;
      }
      setError(caught instanceof Error ? caught.message : "Unable to start pose tracking.");
    } finally {
      setIsBusy(false);
    }
  }

  async function stopTracking() {
    const shouldSaveSession = isTracking;
    setError(null);
    setIsBusy(true);
    try {
      await poseEstimator.stop();
      stopCamera();
      stopPhoneConnection();
      activeSourceRef.current = null;
      setIsTracking(false);
      setPhoneConnected(false);
      setCameraMode(null);
      setPhoneSession(null);
      calibrationPhaseRef.current = "idle";
      calibrationProfileRef.current = null;
      setCalibrationPhase("idle");
      setCalibrationProfile(null);
      setLivePoseBox(null);
      setRegionValid(false);
      setDistanceStatus("unknown");

      if (!shouldSaveSession || !startedAtRef.current) {
        startedAtRef.current = null;
        setMetrics(initialMetrics);
        return;
      }

      const profileId = profileIdRef.current;
      const startedAt = startedAtRef.current ?? new Date();
      const endedAt = new Date();
      if (!profileId) {
        throw new Error("Missing profile for this tracking session.");
      }

      const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
      const samples = confidenceSamplesRef.current;
      const confidenceAvg =
        samples.length > 0 ? samples.reduce((total, sample) => total + sample, 0) / samples.length : 0;
      const session = await apiClient.saveWorkoutSession({
        profileId,
        exercise: "squat",
        durationSeconds,
        repsCompleted: repsRef.current,
        confidenceAvg: Number(confidenceAvg.toFixed(3)),
        completionStatus: repsRef.current > 0 ? "completed" : "partial",
        safetyFlag: false,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString()
      });
      setSavedSession(session);

      await apiClient.savePoseEvent({
        profileId,
        sessionId: session.id,
        eventType: "session_completed",
        confidence: Number(confidenceAvg.toFixed(3)),
        metadata: { repsCompleted: repsRef.current, durationSeconds }
      });

      const review = await apiClient.createCoachReview({ profileId, sessionId: session.id });
      setCoachReview(review);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the workout session.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="pose-coach">
      <div className="pose-coach__header">
        <StatusPill tone={statusTone}>
          {isTracking ? "Tracking live" : phoneSession ? "Waiting for phone" : error ? "Needs attention" : "Ready"}
        </StatusPill>
        <h1>Live squat pose coach</h1>
        <p>
          Camera video is processed in this browser. Phone video travels over an encrypted direct WebRTC
          connection; only the derived session summary and coach review are saved.
        </p>
      </div>

      <div className="pose-coach__workspace">
        <div className={`pose-stage${cameraMode === "phone" ? " pose-stage--phone" : ""}`}>
          <video ref={videoRef} className="pose-stage__video" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="pose-stage__canvas" aria-hidden="true" />
          {displayedActivityRegion && (
            <div
              className={`activity-region activity-region--${calibrationPhase}${
                calibrationPhase === "complete" && !regionValid ? " activity-region--warning" : ""
              }`}
              style={boxStyle(displayedActivityRegion, cameraMode === "local")}
            >
              <span>
                {calibrationPhase === "complete" ? "Activity area" : "Stand inside this area"}
              </span>
            </div>
          )}
          {isTracking && livePoseBox && (
            <div
              className={`live-pose-box${regionValid ? " live-pose-box--valid" : ""}`}
              style={boxStyle(livePoseBox, cameraMode === "local")}
              aria-hidden="true"
            />
          )}
          {!isTracking && (
            <div className="pose-stage__empty">
              {phoneSession ? "Waiting for phone camera" : "Camera preview appears here"}
            </div>
          )}
        </div>

        <aside className="pose-readout">
          <AnimatedSquatCoach
            phase={metrics.phase}
            confidence={metrics.confidence}
            kneeAngle={metrics.kneeAngle}
            isTracking={isTracking}
          />
          <div className="metric-tile">
            <span>Reps</span>
            <strong>{metrics.reps}</strong>
          </div>
          <div className="metric-tile">
            <span>Knee angle</span>
            <strong>{metrics.kneeAngle === null ? "--" : `${metrics.kneeAngle} deg`}</strong>
          </div>
          <div className="metric-tile">
            <span>Confidence</span>
            <strong>{Math.round(metrics.confidence * 100)}%</strong>
          </div>
          <div className="metric-tile">
            <span>Phase</span>
            <strong>{metrics.phase.replace("_", " ")}</strong>
          </div>
          <div className="calibration-readout">
            <div>
              <ScanLine size={19} aria-hidden="true" />
              <span>Calibration</span>
              <strong>{calibrationPhase}</strong>
            </div>
            <div>
              <span>Camera depth</span>
              <strong>{distanceStatus}</strong>
            </div>
            {calibrationProfile && (
              <small>
                Standing {calibrationProfile.standingAngle} deg / target depth {calibrationProfile.depthAngle} deg
              </small>
            )}
          </div>

          <div className="coach-feedback">
            <ShieldAlert size={20} aria-hidden="true" />
            <p>{metrics.feedback}</p>
          </div>

          <div className="pose-actions">
            <button type="button" onClick={startTracking} disabled={isBusy || isTracking}>
              {isBusy && !isTracking ? <Loader2 className="spin" size={18} /> : <Camera size={18} />}
              Use this device
            </button>
            <button type="button" onClick={startPhoneCamera} disabled={isBusy || isTracking || Boolean(phoneSession)}>
              <Smartphone size={18} />
              Use phone
            </button>
            <button
              className="pose-actions__calibrate"
              type="button"
              onClick={beginCalibration}
              disabled={isBusy || !isTracking}
            >
              <RefreshCw size={18} />
              Recalibrate area
            </button>
            <button
              className="pose-actions__end"
              type="button"
              onClick={stopTracking}
              disabled={isBusy || (!isTracking && !phoneSession)}
            >
              {isBusy && isTracking ? <Loader2 className="spin" size={18} /> : <CircleStop size={18} />}
              {phoneSession && !isTracking ? "Cancel connection" : "End and review"}
            </button>
          </div>

          {error && <p className="inline-error">{error}</p>}
          {phoneSession && (
            <div className="phone-connect-panel">
              <div className="phone-connect-panel__qr">
                <QRCodeSVG value={phoneCameraUrl} size={176} level="M" />
              </div>
              <div className="phone-connect-panel__details">
                <span className="phone-connect-panel__status">
                  <Wifi size={17} aria-hidden="true" />
                  {phoneConnected ? "Phone connected" : "Scan with your phone"}
                </span>
                <label htmlFor="phone-camera-origin">Secure phone link</label>
                <input
                  id="phone-camera-origin"
                  type="url"
                  value={phoneBaseUrl}
                  readOnly
                  spellCheck="false"
                />
                {["localhost", "127.0.0.1"].includes(window.location.hostname) && (
                  <small>The HTTPS connection and QR code are generated automatically.</small>
                )}
              </div>
            </div>
          )}
          {savedSession && (
            <div className="session-summary">
              <Save size={18} aria-hidden="true" />
              <span>
                Saved {savedSession.repsCompleted} reps over {savedSession.durationSeconds}s.
              </span>
            </div>
          )}
        </aside>
      </div>

      {coachReview && (
        <div className="review-panel">
          <StatusPill tone="success">Coach review</StatusPill>
          <h2>{coachReview.summaryEn}</h2>
          <p>{coachReview.summaryBn}</p>
          <div className="grid">
            <div className="card">
              <h3>Next action</h3>
              <p>{coachReview.nextAction}</p>
            </div>
            <div className="card">
              <h3>Form focus</h3>
              <p>{coachReview.formFocus.join(", ")}</p>
            </div>
            <div className="card">
              <h3>Safety</h3>
              <p>{coachReview.safetyNote}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
