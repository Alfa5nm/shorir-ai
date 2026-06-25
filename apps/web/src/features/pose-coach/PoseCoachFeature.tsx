import type { CoachReview, LanguagePreference, PhoneCameraSession, WorkoutSession } from "@shorir/contracts";
import { Activity, ArrowLeft, BookOpen, Camera, CircleStop, Loader2, RefreshCw, Save, ScanLine, ShieldAlert, Smartphone, Target, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppServices } from "../../app/providers";
import { ensureProfileId as ensureBrowserProfileId } from "../../app/profileSession";
import type { PoseFrame } from "../../ports/poseEstimator";
import { phoneCameraRtcConfiguration, serializeCandidate, serializeDescription } from "../phone-camera/webrtc";
import { liveCoachGuideFromSearch } from "../exercise-library/exerciseGuides";
import { AnimatedExerciseCoach } from "./AnimatedExerciseCoach";
import { defaultCameraGeometry, resolveCameraGeometry, type CameraGeometry } from "./cameraGeometry";
import {
  createExerciseAnalyzer,
  exerciseDefinitions,
  type AnalyzerSnapshot,
  type NormalizedBox,
  type SupportedExercise
} from "./exerciseAnalyzer";
import {
  createSessionDiagnosticsTracker,
  type SessionDiagnosticsSummary
} from "./sessionDiagnostics";
import { localizedCoachFeedback } from "./coachingLanguage";

type CameraMode = "local" | "phone" | null;
type PoseSource = HTMLVideoElement;

const poseConnections = [
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["left_shoulder", "left_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["right_shoulder", "right_hip"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_shoulder", "right_shoulder"],
  ["left_hip", "right_hip"]
] as const;

function requestedSupportedExercise(value: string | null): SupportedExercise {
  return value === "push-up" || value === "lunge" ? value : "squat";
}

function landmarkByName(frame: PoseFrame, name: string) {
  return frame.landmarks.find((landmark) => landmark.name === name) ?? null;
}

function sourceDimensions(source: PoseSource) {
  return { width: source.videoWidth, height: source.videoHeight };
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedExercise = searchParams.get("exercise");
  const initialExercise = requestedSupportedExercise(requestedExercise);
  const sourceGuide = liveCoachGuideFromSearch(searchParams);
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
  const [selectedExercise, setSelectedExercise] = useState<SupportedExercise>(initialExercise);
  const selectedExerciseRef = useRef<SupportedExercise>(initialExercise);
  const analyzerRef = useRef(createExerciseAnalyzer(initialExercise));
  const confidenceSamplesRef = useRef<number[]>([]);
  const diagnosticsRef = useRef(createSessionDiagnosticsTracker());
  const startedAtRef = useRef<Date | null>(null);
  const profileIdRef = useRef<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyzerSnapshot>(() => analyzerRef.current.snapshot());
  const [isTracking, setIsTracking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>(null);
  const [phoneSession, setPhoneSession] = useState<PhoneCameraSession | null>(null);
  const [phoneConnected, setPhoneConnected] = useState(false);
  const [phoneBaseUrl, setPhoneBaseUrl] = useState(() => window.location.origin);
  const [cameraGeometry, setCameraGeometry] = useState<CameraGeometry>(defaultCameraGeometry);
  const [error, setError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const [coachReview, setCoachReview] = useState<CoachReview | null>(null);
  const [sessionDiagnostics, setSessionDiagnostics] = useState<SessionDiagnosticsSummary | null>(null);
  const [coachLanguage, setCoachLanguage] = useState<LanguagePreference>("mixed");
  const activeSourceGuide = sourceGuide?.liveCoachExercise === selectedExercise ? sourceGuide : null;

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
    if (metrics.calibrationProfile) {
      return metrics.calibrationProfile.region;
    }
    if (metrics.calibrationPhase === "standing" || metrics.calibrationPhase === "depth") {
      if (selectedExercise === "push-up") {
        return { x: 0.05, y: 0.16, width: 0.9, height: 0.68 };
      }
      return selectedExercise === "lunge"
        ? { x: 0.08, y: 0.05, width: 0.84, height: 0.9 }
        : { x: 0.16, y: 0.05, width: 0.68, height: 0.9 };
    }
    return null;
  }, [metrics.calibrationPhase, metrics.calibrationProfile, selectedExercise]);

  const syncCameraGeometry = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return;
    const width = video.videoWidth;
    const height = video.videoHeight;
    const nextGeometry = resolveCameraGeometry(width, height);
    setCameraGeometry((current) =>
      current.width === width && current.height === height
        ? current
        : nextGeometry
    );
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener("loadedmetadata", syncCameraGeometry);
    video.addEventListener("resize", syncCameraGeometry);
    return () => {
      video.removeEventListener("loadedmetadata", syncCameraGeometry);
      video.removeEventListener("resize", syncCameraGeometry);
    };
  }, [syncCameraGeometry]);

  useEffect(() => {
    let active = true;
    void ensureBrowserProfileId(apiClient)
      .then(async (profileId) => {
        profileIdRef.current = profileId;
        const profile = await apiClient.getProfile(profileId);
        if (active && profile) setCoachLanguage(profile.language);
      })
      .catch(() => {
        if (active) setCoachLanguage("mixed");
      });
    return () => {
      active = false;
    };
  }, [apiClient]);

  const selectExercise = useCallback((exercise: SupportedExercise) => {
    selectedExerciseRef.current = exercise;
    setSelectedExercise(exercise);
    analyzerRef.current = createExerciseAnalyzer(exercise);
    setMetrics(analyzerRef.current.snapshot());
    setSavedSession(null);
    setCoachReview(null);
    setSessionDiagnostics(null);
    setError(null);
    setSearchParams({ exercise }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (isBusy || isTracking || phoneSession) return;
    const exercise = requestedSupportedExercise(requestedExercise);
    if (exercise === selectedExerciseRef.current) return;
    selectedExerciseRef.current = exercise;
    setSelectedExercise(exercise);
    analyzerRef.current = createExerciseAnalyzer(exercise);
    setMetrics(analyzerRef.current.snapshot());
    setSavedSession(null);
    setCoachReview(null);
    setSessionDiagnostics(null);
    setError(null);
  }, [isBusy, isTracking, phoneSession, requestedExercise]);

  const resetSessionState = useCallback(() => {
    confidenceSamplesRef.current = [];
    diagnosticsRef.current.reset();
    startedAtRef.current = new Date();
    setSavedSession(null);
    setCoachReview(null);
    setSessionDiagnostics(null);
    const reset = analyzerRef.current.reset();
    setMetrics({ ...reset, feedback: exerciseDefinitions[selectedExerciseRef.current].activeFeedback });
  }, []);

  const beginCalibration = useCallback(() => {
    confidenceSamplesRef.current = [];
    diagnosticsRef.current.reset();
    setSavedSession(null);
    setCoachReview(null);
    setSessionDiagnostics(null);
    setMetrics(analyzerRef.current.beginCalibration());
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraGeometry(defaultCameraGeometry);
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
    const snapshot = analyzerRef.current.process(frame);
    diagnosticsRef.current.record(snapshot);
    confidenceSamplesRef.current.push(snapshot.confidence);
    if (confidenceSamplesRef.current.length > 900) {
      confidenceSamplesRef.current.shift();
    }
    if (snapshot.calibrationCompleted && profileIdRef.current && snapshot.calibrationProfile) {
      const profile = snapshot.calibrationProfile;
      void apiClient.savePoseEvent({
        profileId: profileIdRef.current,
        eventType: "calibration_completed",
        metadata: {
          exercise: selectedExerciseRef.current,
          topAngle: profile.topAngle,
          depthAngle: profile.depthAngle,
          referenceScale: Number(profile.referenceScale.toFixed(4)),
          referenceDepth: profile.referenceDepth === null ? null : Number(profile.referenceDepth.toFixed(4)),
          activityRegion: profile.region
        }
      });
    }
    setMetrics(snapshot);
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
        syncCameraGeometry();
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
          metadata: { exercise: selectedExerciseRef.current, source: "phone_webrtc" }
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
      setMetrics((current) => ({
        ...current,
        feedback: "Scan the QR code and start sharing from your phone. Tracking begins with the first frame."
      }));
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
      syncCameraGeometry();
      activeSourceRef.current = video;
      await poseEstimator.load();
      await poseEstimator.start(video);

      const profileId = await ensureProfileId();
      await apiClient.savePoseEvent({
        profileId,
        eventType: "session_started",
        metadata: { exercise: selectedExerciseRef.current, source: "browser_pose" }
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

      if (!shouldSaveSession || !startedAtRef.current) {
        startedAtRef.current = null;
        setMetrics(analyzerRef.current.reset());
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
      const finalSnapshot = analyzerRef.current.snapshot();
      const diagnostics = diagnosticsRef.current.summary();
      const session = await apiClient.saveWorkoutSession({
        profileId,
        exercise: selectedExerciseRef.current,
        durationSeconds,
        repsCompleted: finalSnapshot.reps,
        confidenceAvg: Number(confidenceAvg.toFixed(3)),
        completionStatus: finalSnapshot.reps > 0 ? "completed" : "partial",
        safetyFlag: false,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString()
      });
      setSavedSession(session);
      setSessionDiagnostics(diagnostics);

      await apiClient.savePoseEvent({
        profileId,
        sessionId: session.id,
        eventType: "session_completed",
        confidence: Number(confidenceAvg.toFixed(3)),
        metadata: {
          exercise: selectedExerciseRef.current,
          repsCompleted: finalSnapshot.reps,
          durationSeconds,
          diagnostics
        }
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
        <h1>{exerciseDefinitions[selectedExercise].heading}</h1>
        <p>
          Camera video is processed in this browser. Phone video travels over an encrypted direct WebRTC
          connection; only the derived session summary and coach review are saved.
        </p>
      </div>

      {activeSourceGuide && (
        <section className="coach-guide-context" aria-labelledby="coach-guide-context-title">
          <div className="coach-guide-context__heading">
            <BookOpen size={21} aria-hidden="true" />
            <div>
              <span>Practice from exercise library</span>
              <h2 id="coach-guide-context-title">{activeSourceGuide.nameEn}</h2>
            </div>
            <Link to={`/exercise-library?guide=${encodeURIComponent(activeSourceGuide.id)}`}>
              <ArrowLeft size={17} aria-hidden="true" />
              Back to guide
            </Link>
          </div>
          <div className="coach-guide-context__cues">
            <div>
              <strong>Set up</strong>
              <span>{activeSourceGuide.setupSteps[0]}</span>
            </div>
            <div>
              <strong>Camera</strong>
              <span>{activeSourceGuide.cameraGuidance[0] ?? "Use a clear side view with the full movement visible."}</span>
            </div>
          </div>
        </section>
      )}

      <div className="exercise-selector" aria-label="Choose an exercise">
        {(["squat", "push-up", "lunge"] as const).map((exercise) => (
          <button
            key={exercise}
            type="button"
            className={selectedExercise === exercise ? "is-active" : ""}
            onClick={() => selectExercise(exercise)}
            disabled={isBusy || isTracking || Boolean(phoneSession)}
          >
            <strong>{exerciseDefinitions[exercise].name}</strong>
            <span>
              {exercise === "squat"
                ? "Standing lower-body coaching"
                : exercise === "lunge"
                  ? "Split-stance lower-body coaching"
                  : "Side-view floor coaching"}
            </span>
          </button>
        ))}
      </div>

      <div className="pose-coach__workspace">
        <div
          className={`pose-stage pose-stage--${cameraGeometry.orientation}${
            cameraMode ? " pose-stage--active" : ""
          }${cameraMode === "phone" ? " pose-stage--phone" : ""}`}
          style={{
            aspectRatio: `${cameraGeometry.width} / ${cameraGeometry.height}`,
            maxWidth:
              cameraGeometry.orientation === "portrait"
                ? `min(100%, calc(78vh * ${cameraGeometry.aspectRatio}))`
                : "100%"
          }}
          data-camera-width={cameraGeometry.width}
          data-camera-height={cameraGeometry.height}
        >
          <video ref={videoRef} className="pose-stage__video" autoPlay playsInline muted />
          <canvas ref={canvasRef} className="pose-stage__canvas" aria-hidden="true" />
          {displayedActivityRegion && (
            <div
              className={`activity-region activity-region--${metrics.calibrationPhase}${
                metrics.calibrationPhase === "complete" && !metrics.regionValid ? " activity-region--warning" : ""
              }`}
              style={boxStyle(displayedActivityRegion, cameraMode === "local")}
            >
              <span>
                {metrics.calibrationPhase === "complete" ? "Activity area" : "Set up inside this area"}
              </span>
            </div>
          )}
          {isTracking && metrics.livePoseBox && (
            <div
              className={`live-pose-box${metrics.regionValid ? " live-pose-box--valid" : ""}`}
              style={boxStyle(metrics.livePoseBox, cameraMode === "local")}
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
          <AnimatedExerciseCoach
            exercise={selectedExercise}
            phase={metrics.phase}
            confidence={metrics.confidence}
            primaryAngle={metrics.primaryAngle}
            isTracking={isTracking}
            language={coachLanguage}
          />
          <div className="metric-tile">
            <span>Reps</span>
            <strong>{metrics.reps}</strong>
          </div>
          <div className="metric-tile">
            <span>{metrics.primaryAngleLabel}</span>
            <strong>{metrics.primaryAngle === null ? "--" : `${metrics.primaryAngle} deg`}</strong>
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
              <strong>{metrics.calibrationPhase}</strong>
            </div>
            <div>
              <span>Camera depth</span>
              <strong>{metrics.distanceStatus}</strong>
            </div>
            <div>
              <span>Counting</span>
              <strong>{metrics.repGateStatus.replaceAll("_", " ")}</strong>
            </div>
            {metrics.qualityReasons.length > 0 && (
              <small>{metrics.qualityReasons.map((reason) => reason.replaceAll("_", " ")).join(" / ")}</small>
            )}
            {metrics.calibrationProfile && (
              <small>
                Top {metrics.calibrationProfile.topAngle} deg / target depth {metrics.calibrationProfile.depthAngle} deg
                {metrics.calibrationProfile.referenceDepth === null ? " / scale-only depth" : " / relative depth locked"}
              </small>
            )}
          </div>

          <div className="coach-feedback">
            <ShieldAlert size={20} aria-hidden="true" />
            <p>{localizedCoachFeedback(metrics.feedbackCode, metrics.feedback, coachLanguage)}</p>
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
      {sessionDiagnostics && (
        <section className="diagnostics-panel" aria-labelledby="session-diagnostics-title">
          <div className="diagnostics-panel__heading">
            <div>
              <StatusPill tone={sessionDiagnostics.qualityScore >= 75 ? "success" : "warning"}>
                Session quality {sessionDiagnostics.qualityScore}%
              </StatusPill>
              <h2 id="session-diagnostics-title">What the detector accepted and rejected</h2>
            </div>
            <Target size={28} aria-hidden="true" />
          </div>
          <div className="diagnostics-panel__metrics">
            <article>
              <Activity size={19} aria-hidden="true" />
              <span>Counted reps</span>
              <strong>{sessionDiagnostics.countedReps}</strong>
            </article>
            <article>
              <ShieldAlert size={19} aria-hidden="true" />
              <span>Rejected attempts</span>
              <strong>{sessionDiagnostics.rejectedAttempts}</strong>
            </article>
            <article>
              <ScanLine size={19} aria-hidden="true" />
              <span>Tracking accepted</span>
              <strong>
                {sessionDiagnostics.totalFrames > 0
                  ? Math.round((sessionDiagnostics.readyFrames / sessionDiagnostics.totalFrames) * 100)
                  : 0}%
              </strong>
            </article>
          </div>
          <div className="diagnostics-panel__details">
            <div>
              <h3>Most common pauses</h3>
              {sessionDiagnostics.topIssues.length > 0 ? (
                <ol>
                  {sessionDiagnostics.topIssues.map((issue) => (
                    <li key={issue.reason}>
                      <span>{issue.reason}</span>
                      <strong>{issue.count}</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No recurring tracking problems were detected.</p>
              )}
            </div>
            <div>
              <h3>Next setup adjustment</h3>
              <p>{sessionDiagnostics.nextAction}</p>
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
