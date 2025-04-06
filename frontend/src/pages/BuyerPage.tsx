import { useEffect, useRef, useState } from "react";

export default function BuyerPage() {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingSessionActive, setSpeakingSessionActive] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  // Function to send a text message to the agent
  const sendMessageToAgent = (messageText: string) => {
    if (dataChannelRef.current?.readyState === "open") {
      const userMessage = {
        type: "conversation.item.create",
        item: {
          role: "user",
          content: [
            {
              type: "text",
              text: messageText,
            },
          ],
        },
      };
      dataChannelRef.current.send(JSON.stringify(userMessage));
    } else {
      console.error("Data channel is not open");
    }
  };

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
          for (let i = 0; i < event.data.content.length; i++) {
            message_text.push(event.data.content[i]);
          }
        };
        dataChannelRef.current = dc;
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
              // if (
              //   outputItem.type === "function_call" &&
              //   outputItem.name &&
              //   outputItem.arguments
              // ) {
              // handleFunctionCall({
              //   name: outputItem.name,
              //   call_id: outputItem.call_id,
              //   arguments: outputItem.arguments,
              // });
              // }
            });
          }
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

        const systemMessage = {
          type: "session.update",
          session: {
            instructions:
              "You are an AI shopping assistant for an e-commerce platform. Help users find products, answer questions about item specifications, assist with the checkout process, and provide personalized recommendations based on user preferences. If users want to purchase an item, use the stripe_function to generate a payment link. Be friendly, professional, and knowledgeable about common consumer products.",
            voice: "alloy",
            tools: [
              {
                type: "function",
                function: {
                  name: "stripe_function",
                  description:
                    "use stripe to generate a payment link for the user",
                  parameters: {
                    type: "object",
                    properties: {
                      price: {
                        type: "number",
                        description: "the price of the item",
                      },
                    },
                    required: ["price"],
                    additionalProperties: false,
                  },
                  strict: true,
                },
              },
            ],
            tool_choice: "auto",
            input_audio_transcription: { model: "whisper-1" },
            temperature: 0.5,
          },
        };

        // Send the system message to the agent
        dc.send(JSON.stringify(systemMessage));

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
        <div className="flex flex-col gap-4">
          <button
            onClick={() => {
              setSpeakingSessionActive(false);
              cleanupSpeakingSession();
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md"
          >
            <div>Speaking session active, press to stop</div>
          </button>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type a message to the agent..."
              className="border border-gray-300 rounded-md px-3 py-2 flex-grow"
            />
            <button
              onClick={() => {
                if (userMessage.trim()) {
                  sendMessageToAgent(userMessage);
                  setUserMessage("");
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md"
            >
              Send
            </button>
          </div>
        </div>
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
