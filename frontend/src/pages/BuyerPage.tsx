import { useEffect, useRef, useState } from "react";

export default function BuyerPage() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingSessionActive, setSpeakingSessionActive] = useState(false);

  const activateSpeakingSession = async () => {
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

        dc.onopen = () => {
          const systemMessage = {
            type: "session.update",
            session: {
              instructions:
                "You are a chill shop assistant named 'Jeff' that can help the user buy items from the following list at a garage sale: " +
                "2. A pair of jeans for $50" +
                "3. A pair of socks for $10" +
                "4. A pair of underwear for $5" +
                "5. A pair of shoes for $100",
              tools: [
                {
                  type: "function",
                  name: "stripe_function",
                  description:
                    "use stripe to generate a payment link for the user when the user agrees to the price",
                  parameters: {
                    type: "object",
                    properties: {
                      price: {
                        type: "number",
                        description:
                          "this is the price of the item the user wants to buy.",
                      },
                    },
                    required: ["price"],
                    additionalProperties: false,
                  },
                },
              ],
              tool_choice: "auto",
            },
          };
          dc.send(JSON.stringify(systemMessage));
          console.log("the channel is open and the system message was sent!");
        };

        dc.onmessage = async (event) => {
          const message_text = [];
          const messageData = JSON.parse(event.data);
          if (
            messageData.type === "response.done" &&
            messageData.response?.output?.[0]?.content?.[0]?.transcript
          ) {
            console.log(
              "Transcript:",
              messageData.response.output[0].content[0].transcript
            );
          }
        };

        dc.addEventListener("message", (e) => {
          // Handle realtime server events here
          console.log("received message from server events");
          console.log(e);
          const serverEvent = JSON.parse(e.data);
          console.log(serverEvent.type);
          if (serverEvent.type == "response.done") {
            console.log("the server event is a response.done");
            serverEvent.response.output.forEach((outputItem: any) => {
              console.log(outputItem);
              if (
                outputItem.type === "function_call" &&
                outputItem.name &&
                outputItem.arguments
              ) {
                console.log("the function call is a function_call");
                console.log(outputItem.name);
                console.log(outputItem.arguments);
                // handleFunctionCall({
                //   name: outputItem.name,
                //   call_id: outputItem.call_id,
                //   arguments: outputItem.arguments,
                // });
              }
            });
          }
        });

        dataChannelRef.current = dc;

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
  };

  const cleanupSpeakingSession = () => {
    // Close and cleanup WebRTC connection when component unmounts
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (audioRef.current) {
      document.body.removeChild(audioRef.current);
    }
  };

  return (
    <main className="mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Browse Items</h1>

      {speakingSessionActive ? (
        <button
          onClick={() => {
            setSpeakingSessionActive(false);
            cleanupSpeakingSession();
          }}
        >
          <div>Speaking session active, press to stop</div>
        </button>
      ) : (
        <button
          onClick={async () => {
            setSpeakingSessionActive(!speakingSessionActive);
            await activateSpeakingSession();
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          {speakingSessionActive ? "End Session" : "Start Session"}
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
    </main>
  );
}
