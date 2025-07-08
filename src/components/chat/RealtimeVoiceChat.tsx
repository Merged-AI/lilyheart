"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "child" | "ai";
  timestamp: Date;
}

interface RealtimeVoiceChatProps {
  childId: string;
  onMessageReceived: (message: Message) => void;
  onSessionStart: () => void;
  onSessionEnd: () => void;
  isActive: boolean;
}

export default function RealtimeVoiceChat({
  childId,
  onMessageReceived,
  onSessionStart,
  onSessionEnd,
  isActive,
}: RealtimeVoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (audioElement.current) {
      audioElement.current.srcObject = null;
      audioElement.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("Disconnected");
    setError(null);
  }, []);

  // Start realtime session
  const startSession = useCallback(async () => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);
      setConnectionStatus("Connecting...");

      // Get session token
      const tokenResponse = await fetch(
        `/api/chat/realtime-token?childId=${childId}`
      );
      if (!tokenResponse.ok) {
        throw new Error("Failed to get session token");
      }

      const tokenData = await tokenResponse.json();
      const EPHEMERAL_KEY = tokenData.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // Set up audio element for AI responses
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      audioElement.current.style.display = "none";
      document.body.appendChild(audioElement.current);

      // Handle incoming audio tracks from AI
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
        }
      };

      // Get user's microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      // Add local audio track
      pc.addTrack(mediaStream.getTracks()[0]);

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // Set up data channel event listeners
      dc.addEventListener("open", () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus("Connected");
        onSessionStart();

        // Send initial therapeutic context
        sendTherapeuticContext();
      });

      dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        handleServerEvent(event);
      });

      dc.addEventListener("close", () => {
        cleanup();
        onSessionEnd();
      });

      // Create and send offer
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

      if (!sdpResponse.ok) {
        throw new Error("Failed to establish connection with OpenAI");
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);
    } catch (err) {
      console.error("Error starting realtime session:", err);
      setError(err instanceof Error ? err.message : "Failed to start session");
      setIsConnecting(false);
      setConnectionStatus("Connection failed");
      cleanup();
    }
  }, [
    childId,
    isConnecting,
    isConnected,
    cleanup,
    onSessionStart,
    onSessionEnd,
  ]);

  // Stop session
  const stopSession = useCallback(() => {
    cleanup();
    onSessionEnd();
  }, [cleanup, onSessionEnd]);

  // Send therapeutic context to AI
  const sendTherapeuticContext = useCallback(async () => {
    if (!dataChannel.current || !isConnected) return;

    try {
      // Get child's therapeutic context from the API
      const response = await fetch(
        `/api/chat/child-context?childId=${childId}`
      );
      if (response.ok) {
        const { childContext } = await response.json();

        const contextEvent = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: `I'm a child seeking therapeutic support. Please respond as Dr. Emma, a caring child therapist. Here's my therapeutic profile: ${childContext}. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance. Use my name when appropriate and reference my specific concerns and background.`,
              },
            ],
          },
        };

        dataChannel.current.send(JSON.stringify(contextEvent));
      } else {
        // Fallback to generic context
        const fallbackEvent = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: "I'm a child seeking therapeutic support. Please respond as Dr. Emma, a caring child therapist. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance.",
              },
            ],
          },
        };

        dataChannel.current.send(JSON.stringify(fallbackEvent));
      }
    } catch (error) {
      console.error("Error fetching child context:", error);
      // Fallback to generic context
      const fallbackEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "I'm a child seeking therapeutic support. Please respond as Dr. Emma, a caring child therapist. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance.",
            },
          ],
        },
      };

      dataChannel.current.send(JSON.stringify(fallbackEvent));
    }
  }, [isConnected, childId]);

  // Send text message
  const sendTextMessage = useCallback(
    (message: string) => {
      if (!dataChannel.current || !isConnected) return;

      const event = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: message,
            },
          ],
        },
      };

      dataChannel.current.send(JSON.stringify(event));
      dataChannel.current.send(JSON.stringify({ type: "response.create" }));
    },
    [isConnected]
  );

  // Handle server events
  const handleServerEvent = useCallback(
    (event: any) => {
      console.log("Server event received:", event);

      if (event.type === "conversation.item.completed") {
        const item = event.item;
        if (item.type === "message" && item.role === "assistant") {
          const content = item.content?.[0];
          if (content?.type === "output_text") {
            const aiMessage: Message = {
              id: Date.now().toString(),
              content: content.text,
              sender: "ai",
              timestamp: new Date(),
            };
            onMessageReceived(aiMessage);
          }
        }
      } else if (event.type === "conversation.item.created") {
        const item = event.item;
        if (item.type === "message" && item.role === "user") {
          const content = item.content?.[0];
          if (content?.type === "input_text") {
            const userMessage: Message = {
              id: Date.now().toString(),
              content: content.text,
              sender: "child",
              timestamp: new Date(),
            };
            onMessageReceived(userMessage);
          }
        }
      }
    },
    [onMessageReceived]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioElement.current) {
        document.body.removeChild(audioElement.current);
      }
    };
  }, [cleanup]);

  // Auto-start when component becomes active
  useEffect(() => {
    if (isActive && !isConnected && !isConnecting) {
      startSession();
    }
  }, [isActive, isConnected, isConnecting, startSession]);

  if (error) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={startSession}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="text-center p-6">
      {isConnecting ? (
        <div>
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
          <p className="text-purple-600">Connecting to Dr. Emma...</p>
          <p className="text-sm text-gray-500 mt-1">{connectionStatus}</p>
        </div>
      ) : isConnected ? (
        <div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-green-700 mb-2">
            Connected to Dr. Emma
          </h3>
          <p className="text-green-600 mb-4">
            Speak naturally! Dr. Emma is listening and will respond in
            real-time.
          </p>
        </div>
      ) : (
        <div>
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-purple-700 mb-2">
            Start Voice Chat
          </h3>
          <p className="text-purple-600 mb-4">
            Click to connect with Dr. Emma for real-time voice conversation
          </p>
          <button
            onClick={startSession}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto"
          >
            <Mic className="h-4 w-4" />
            <span>Connect</span>
          </button>
        </div>
      )}
    </div>
  );
}
