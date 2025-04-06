import { useEffect, useRef } from "react";

export default function BuyerPage() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element for playback
    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    document.body.appendChild(audioEl);
    audioRef.current = audioEl;

    const connectRealtimeApi = async () => {
      try {
        // Get the ephemeral key from your server
        const response = await fetch(
          "http://127.0.0.1:8000/create-realtime-key"
        );
        const data = await response.json();
        const EPHEMERAL_KEY = data.client_secret.value || data.client_secret; // Adjust based on your API response structure

        // Create a peer connection
        const pc = new RTCPeerConnection();
        peerConnectionRef.current = pc;

        // Set up to play remote audio from the model
        pc.ontrack = (e) => {
          if (audioRef.current) {
            audioRef.current.srcObject = e.streams[0];
          }
        };

        // Add local audio track for microphone input
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        pc.addTrack(ms.getTracks()[0]);

        // Set up data channel for sending and receiving events
        const dc = pc.createDataChannel("oai-events");
        dataChannelRef.current = dc;
        dc.addEventListener("message", (e) => {
          // Handle realtime server events here
          console.log("Received message:", e);
        });

        // Start the session using SDP
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const baseUrl = "https://api.openai.com/v1/realtime";
        const model = "gpt-4o-realtime-preview-2024-12-17";
        const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
          },
        });

        const answer = {
          type: "answer" as RTCSdpType,
          sdp: await sdpResponse.text(),
        };
        await pc.setRemoteDescription(answer);

        console.log("Realtime connection established successfully");
      } catch (error) {
        console.error("Error setting up realtime connection:", error);
      }
    };

    connectRealtimeApi();

    // Cleanup function
    return () => {
      // Close and cleanup WebRTC connection when component unmounts
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (audioRef.current) {
        document.body.removeChild(audioRef.current);
      }
    };
  }, []);

  return (
    <main className="mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Items</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </main>
  );
}
