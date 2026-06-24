import { Camera, Loader2, Wifi } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { StatusPill } from "../../components/ui/StatusPill";
import { useAppServices } from "../../app/providers";
import { phoneCameraRtcConfiguration, serializeCandidate, serializeDescription } from "./webrtc";

export function PhoneCameraFeature() {
  const { id } = useParams();
  const { apiClient } = useAppServices();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const intervalRef = useRef<number | null>(null);
  const coachCandidatesRef = useRef(new Set<string>());
  const offerSdpRef = useRef<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("Open this page on your phone and start camera sharing.");
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  async function startStreaming() {
    if (!id) {
      setError("Missing phone camera session id.");
      return;
    }

    setIsBusy(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element is unavailable.");
      }
      video.srcObject = stream;
      await video.play();

      const peer = new RTCPeerConnection(phoneCameraRtcConfiguration());
      peerRef.current = peer;
      for (const track of stream.getTracks()) {
        peer.addTrack(track, stream);
      }
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          void apiClient
            .addPhoneCameraIceCandidate(id, {
              role: "phone",
              candidate: serializeCandidate(event.candidate)
            })
            .catch(() => setError("Unable to exchange network connection details."));
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setStatus("Connected directly. Keep the phone pointed at your full body.");
        } else if (["disconnected", "failed"].includes(peer.connectionState)) {
          setStatus("Connection interrupted. Keep this page open while it reconnects.");
        }
      };

      const connect = async () => {
        const signal = await apiClient.getPhoneCameraSignal(id);
        if (signal.offer && signal.offer.sdp !== offerSdpRef.current) {
          offerSdpRef.current = signal.offer.sdp;
          coachCandidatesRef.current.clear();
          await peer.setRemoteDescription(signal.offer);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await apiClient.savePhoneCameraAnswer(id, serializeDescription(peer.localDescription!));
        }
        if (peer.remoteDescription) {
          for (const candidate of signal.coachCandidates) {
            if (!coachCandidatesRef.current.has(candidate.candidate)) {
              coachCandidatesRef.current.add(candidate.candidate);
              await peer.addIceCandidate(candidate);
            }
          }
        }
      };

      await connect();
      intervalRef.current = window.setInterval(() => {
        void connect().catch(() => setError("Unable to complete the phone camera connection."));
      }, 500);
      setIsStreaming(true);
      setStatus("Camera ready. Connecting directly to your coach screen...");
    } catch (caught) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(caught instanceof Error ? caught.message : "Unable to start phone camera.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="phone-camera-page">
      <StatusPill tone={isStreaming ? "success" : error ? "warning" : "neutral"}>
        {isStreaming ? "Streaming" : "Phone camera"}
      </StatusPill>
      <h1>Phone camera</h1>
      <p>{status}</p>

      <div className="phone-camera-preview">
        <video ref={videoRef} playsInline muted />
        {!isStreaming && (
          <div className="phone-camera-preview__empty">
            <Camera size={34} aria-hidden="true" />
          </div>
        )}
      </div>
      <button className="primary-action" type="button" onClick={startStreaming} disabled={isBusy || isStreaming}>
        {isBusy ? <Loader2 className="spin" size={18} /> : <Wifi size={18} />}
        Share camera
      </button>

      {error && <p className="inline-error">{error}</p>}
    </section>
  );
}
