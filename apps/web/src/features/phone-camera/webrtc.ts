import type { PhoneCameraIceCandidate, PhoneCameraSessionDescription } from "@shorir/contracts";

export function phoneCameraRtcConfiguration(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  const turnUrl = import.meta.env.VITE_WEBRTC_TURN_URL;
  const turnUsername = import.meta.env.VITE_WEBRTC_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_WEBRTC_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential
    });
  }

  return {
    iceServers,
    bundlePolicy: "max-bundle",
    iceCandidatePoolSize: 4
  };
}

export function serializeDescription(
  description: RTCSessionDescription | RTCSessionDescriptionInit
): PhoneCameraSessionDescription {
  if (!description.sdp || (description.type !== "offer" && description.type !== "answer")) {
    throw new Error("WebRTC generated an invalid session description.");
  }
  return { type: description.type, sdp: description.sdp };
}

export function serializeCandidate(candidate: RTCIceCandidate): PhoneCameraIceCandidate {
  return {
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment
  };
}
