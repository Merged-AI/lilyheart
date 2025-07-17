"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Loader2, AlertCircle } from "lucide-react";

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
  forceCleanup?: () => void;
}

export default function RealtimeVoiceChat({
  childId,
  onMessageReceived,
  onSessionStart,
  onSessionEnd,
  isActive,
  forceCleanup,
}: RealtimeVoiceChatProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const isCleaningUp = useRef(false);
  const processedResponseIds = useRef<Set<string>>(new Set());
  const lastAIResponse = useRef<string>("");
  const lastAIResponseTime = useRef<number>(0);
  const processingCooldown = 2000;
  const transcriptBuffer = useRef<Map<string, string>>(new Map());
  const processedUserMessages = useRef<Set<string>>(new Set());
  const lastUserMessage = useRef<string>("");
  const lastUserMessageTime = useRef<number>(0);
  const userMessageCooldown = 1000; // 1 second cooldown between user messages
  const pendingUserMessage = useRef<string>("");
  const pendingSessionId = useRef<string>("");
  const isProcessingResponse = useRef<boolean>(false);
  const [isInputCooldown, setIsInputCooldown] = useState(false);
  const [isResponseCooldown, setIsResponseCooldown] = useState(false);
  const COOLDOWN_DURATION = 5000; // 5 seconds

  // Cleanup function
  const cleanup = useCallback(() => {
    isCleaningUp.current = true;
    setIsInputCooldown(false);
    setIsResponseCooldown(false);

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus("Disconnected");
    setError(null);

    processedResponseIds.current.clear();
    lastAIResponse.current = "";
    lastAIResponseTime.current = 0;
    transcriptBuffer.current.clear();
    processedUserMessages.current.clear();
    lastUserMessage.current = "";
    lastUserMessageTime.current = 0;
    pendingUserMessage.current = "";
    pendingSessionId.current = "";

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      })
      .catch(() => {});

    if (dataChannel.current) {
      dataChannel.current.onopen = null;
      dataChannel.current.onclose = null;
      dataChannel.current.onerror = null;
      dataChannel.current.onmessage = null;
      dataChannel.current.close();
      dataChannel.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (audioElement.current) {
      audioElement.current.srcObject = null;
      if (document.body.contains(audioElement.current)) {
        document.body.removeChild(audioElement.current);
      }
      audioElement.current = null;
    }
  }, []);

  // Store user message in backend and get session ID
  const storeUserMessageInBackend = useCallback(
    async (content: string) => {
      try {
        const response = await fetch("/api/chat/realtime-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "store_user_message",
            childId,
            data: {
              content,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.sessionId) {
            pendingSessionId.current = result.sessionId;
          }
        }
      } catch (error) {
        console.error("Error storing user message:", error);
      }
    },
    [childId]
  );

  // Update session with AI response
  const storeAIResponseInBackend = useCallback(
    async (content: string) => {
      if (!pendingSessionId.current || !pendingUserMessage.current) {
        console.warn(
          "Missing pending session ID or user message for AI response"
        );
        return;
      }

      try {
        const response = await fetch("/api/chat/realtime-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "store_ai_response",
            childId,
            data: {
              sessionId: pendingSessionId.current,
              content,
              userMessage: pendingUserMessage.current,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // Clear pending data after successful storage
          pendingSessionId.current = "";
          pendingUserMessage.current = "";
        }
      } catch (error) {
        console.error("Error storing conversation:", error);
      }
    },
    [childId]
  );

  // Helper function to check if response is duplicate
  const isDuplicateResponse = useCallback(
    (responseText: string, responseId?: string) => {
      // Check if we've already processed this exact response ID
      if (responseId && processedResponseIds.current.has(responseId)) {
        return true;
      }

      // Check if we're still processing a response
      if (isProcessingResponse.current) {
        return true;
      }

      // Check time-based cooldown
      const now = Date.now();
      if (now - lastAIResponseTime.current < processingCooldown) {
        return true;
      }

      // Check for similar content
      const normalizedNew = responseText.toLowerCase().trim();
      const normalizedLast = lastAIResponse.current.toLowerCase().trim();

      if (normalizedLast && normalizedNew) {
        const similarity = calculateSimilarity(normalizedNew, normalizedLast);
        if (similarity > 0.7) {
          return true;
        }
      }

      return false;
    },
    []
  );

  // Helper function to calculate text similarity for AI responses
  const calculateSimilarity = (text1: string, text2: string) => {
    const words1 = text1.split(" ").filter((word) => word.length > 2);
    const words2 = text2.split(" ").filter((word) => word.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    const commonWords = words1.filter((word) => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Helper function to process user voice transcript
  const processUserVoiceTranscript = (transcript: string) => {
    if (!transcript || transcript.trim() === "" || isInputCooldown) {
      return;
    }

    // Normalize and clean the transcript
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Ignore very short or meaningless transcripts
    if (
      normalizedTranscript.length < 3 ||
      normalizedTranscript === "mm" ||
      normalizedTranscript === "hmm" ||
      normalizedTranscript === "um" ||
      normalizedTranscript === "uh"
    ) {
      return;
    }

    // Start cooldown for voice input
    setIsInputCooldown(true);
    setTimeout(() => {
      setIsInputCooldown(false);
    }, COOLDOWN_DURATION);

    // Check cooldown period
    const now = Date.now();
    if (now - lastUserMessageTime.current < userMessageCooldown) {
      return;
    }

    // Check if we've processed this exact message
    if (processedUserMessages.current.has(normalizedTranscript)) {
      return;
    }

    // Check similarity with last message
    if (lastUserMessage.current) {
      const similarity = calculateTextSimilarity(
        normalizedTranscript,
        lastUserMessage.current.toLowerCase()
      );
      if (similarity > 0.7) {
        // 70% similarity threshold
        return;
      }
    }

    // Only process if it looks like a real message
    if (transcript.split(" ").length < 2 && !transcript.endsWith("?")) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: transcript,
      sender: "child",
      timestamp: new Date(),
    };

    onMessageReceived(userMessage);

    // Store user message and get session ID for later AI response
    storeUserMessageInBackend(transcript);

    // Track this message
    processedUserMessages.current.add(normalizedTranscript);
    lastUserMessage.current = normalizedTranscript;
    lastUserMessageTime.current = now;
    pendingUserMessage.current = transcript;

    // Keep only recent messages in memory
    if (processedUserMessages.current.size > 5) {
      const messagesArray = Array.from(processedUserMessages.current);
      processedUserMessages.current.clear();
      messagesArray
        .slice(-5)
        .forEach((msg) => processedUserMessages.current.add(msg));
    }

    // Send therapeutic context on first user input
    if (processedUserMessages.current.size === 0) {
      sendTherapeuticContext();
    }
  };

  // Helper function to calculate text similarity
  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = text1.split(/\s+/).filter((word) => word.length > 1);
    const words2 = text2.split(/\s+/).filter((word) => word.length > 1);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    const commonWords = words1.filter((word) => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  // Helper function to process AI response
  const processAIResponse = useCallback(
    (responseText: string, responseId?: string) => {
      if (!responseText || responseText.trim() === "" || isResponseCooldown) {
        return;
      }

      // Skip if duplicate
      if (isDuplicateResponse(responseText, responseId)) {
        return;
      }

      // Start cooldown for AI responses
      setIsResponseCooldown(true);
      setTimeout(() => {
        setIsResponseCooldown(false);
      }, COOLDOWN_DURATION);

      // Set processing flag
      isProcessingResponse.current = true;

      try {
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: responseText,
          sender: "ai",
          timestamp: new Date(),
        };

        onMessageReceived(aiMessage);
        storeAIResponseInBackend(responseText);

        // Track this response
        if (responseId) {
          processedResponseIds.current.add(responseId);
        }
        lastAIResponse.current = responseText;
        lastAIResponseTime.current = Date.now();

        // Keep response history manageable
        if (processedResponseIds.current.size > 10) {
          const idsArray = Array.from(processedResponseIds.current);
          processedResponseIds.current.clear();
          idsArray
            .slice(-10)
            .forEach((id) => processedResponseIds.current.add(id));
        }
      } finally {
        // Clear processing flag after a short delay
        setTimeout(() => {
          isProcessingResponse.current = false;
        }, processingCooldown);
      }
    },
    [
      onMessageReceived,
      storeAIResponseInBackend,
      isDuplicateResponse,
      isResponseCooldown,
    ]
  );

  // Start realtime session
  const startSession = useCallback(async () => {
    if (isConnecting || isConnected || !isActive || isCleaningUp.current)
      return;

    try {
      setIsConnecting(true);
      setError(null);
      setConnectionStatus("Connecting...");

      // Reset deduplication tracking for new session
      processedResponseIds.current.clear();
      lastAIResponse.current = "";
      lastAIResponseTime.current = 0;
      processedUserMessages.current.clear();
      lastUserMessage.current = "";
      lastUserMessageTime.current = 0;
      pendingUserMessage.current = "";
      pendingSessionId.current = "";

      // Create session through backend
      const sessionResponse = await fetch("/api/chat/realtime-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_session",
          childId,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const sessionData = await sessionResponse.json();
      const EPHEMERAL_KEY = sessionData.client_secret.value;

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // Monitor connection state
      pc.addEventListener("connectionstatechange", () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          cleanup();
          onSessionEnd();
        }
      });

      pc.addEventListener("iceconnectionstatechange", () => {
        if (
          pc.iceConnectionState === "failed" ||
          pc.iceConnectionState === "disconnected"
        ) {
          cleanup();
          onSessionEnd();
        }
      });

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

      // Get user's microphone with optimized settings for earbuds
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000, // Reduced sample rate for better compatibility
          channelCount: 1,
          sampleSize: 16,
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
      });

      dc.addEventListener("message", (e) => {
        if (isCleaningUp.current) return;
        try {
          const event = JSON.parse(e.data);
          handleServerEvent(event);
        } catch (error) {
          // Ignore parsing errors
        }
      });

      dc.addEventListener("close", () => {
        cleanup();
        onSessionEnd();
      });

      dc.addEventListener("error", () => {
        cleanup();
        onSessionEnd();
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send SDP offer through backend
      const sdpResponse = await fetch("/api/chat/realtime-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send_sdp_offer",
          childId,
          data: {
            sdp: offer.sdp,
            model: "gpt-4o-realtime-preview-2024-12-17",
            ephemeralKey: EPHEMERAL_KEY,
          },
        }),
      });

      if (!sdpResponse.ok) {
        const errorData = await sdpResponse.json();
        throw new Error(
          errorData.error || "Failed to establish connection with OpenAI"
        );
      }

      const answerData = await sdpResponse.json();
      const answer = {
        type: "answer" as RTCSdpType,
        sdp: answerData.sdp,
      };

      await pc.setRemoteDescription(answer);
    } catch (err) {
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

  // Send therapeutic context to AI (only when user speaks first)
  const sendTherapeuticContext = useCallback(async () => {
    if (!dataChannel.current || !isConnected) return;

    try {
      // Get child's therapeutic context from the backend
      const response = await fetch("/api/chat/realtime-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get_child_context",
          childId,
        }),
      });

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
                text: `You are Dr. Emma, a caring child therapist. IMPORTANT: Always respond in English only. Here's the child's therapeutic profile: ${childContext}. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance. Use the child's name when appropriate and reference their specific concerns and background. Wait for the child to speak first before responding.`,
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
                text: "You are Dr. Emma, a caring child therapist. IMPORTANT: Always respond in English only. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance. Wait for the child to speak first before responding.",
              },
            ],
          },
        };

        dataChannel.current.send(JSON.stringify(fallbackEvent));
      }
    } catch (error) {
      // Fallback to generic context
      const fallbackEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "You are Dr. Emma, a caring child therapist. IMPORTANT: Always respond in English only. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance. Wait for the child to speak first before responding.",
            },
          ],
        },
      };

      dataChannel.current.send(JSON.stringify(fallbackEvent));
    }
  }, [isConnected, childId]);

  // Handle server events
  const handleServerEvent = useCallback(
    (event: any) => {
      // Ignore events if cleanup is in progress
      if (isCleaningUp.current) {
        return;
      }

      switch (event.type) {
        case "conversation.item.created":
          {
            const item = event.item;
            if (item.type === "message" && item.role === "user") {
              const content = item.content?.[0];

              // Handle voice input with transcript
              if (content?.type === "input_audio" && content.transcript) {
                processUserVoiceTranscript(content.transcript);
              }
              // Handle text input
              else if (content?.type === "input_text" && content.text) {
                processUserVoiceTranscript(content.text);
              }
            }
          }
          break;

        case "conversation.item.completed": {
          const item = event.item;

          if (item.type === "message" && item.role === "assistant") {
            const content = item.content?.[0];

            // Only process text responses here
            if (content?.type === "output_text" && content.text) {
              processAIResponse(content.text, event.response_id);
            }
          } else if (item.type === "message" && item.role === "user") {
            const content = item.content?.[0];

            if (content?.type === "input_audio" && content.transcript) {
              processUserVoiceTranscript(content.transcript);
            } else if (content?.type === "input_text" && content.text) {
              processUserVoiceTranscript(content.text);
            }
          }
          break;
        }

        case "conversation.item.input_audio_transcription.delta":
          {
            // Handle incremental transcript deltas
            if (event.item_id && event.delta) {
              const currentTranscript =
                transcriptBuffer.current.get(event.item_id) || "";
              const updatedTranscript = currentTranscript + event.delta;
              transcriptBuffer.current.set(event.item_id, updatedTranscript);
            }
          }
          break;

        case "conversation.item.input_audio_transcription.completed":
          {
            let finalTranscript = event.transcript;

            // If the event transcript is empty, try to get from buffer
            if (!finalTranscript && event.item_id) {
              finalTranscript =
                transcriptBuffer.current.get(event.item_id) || "";
            }

            if (finalTranscript && finalTranscript.trim() !== "") {
              processUserVoiceTranscript(finalTranscript);
              // Clean up the buffer
              if (event.item_id) {
                transcriptBuffer.current.delete(event.item_id);
              }
            }
          }
          break;

        case "input_audio_buffer.committed":
          if (event.transcript) {
            processUserVoiceTranscript(event.transcript);
          }
          break;

        case "response.audio_transcript.delta":
          if (event.delta) {
            // Skip empty delta handling
          }
          break;

        case "response.audio_transcript.done": {
          if (event.transcript) {
            processAIResponse(event.transcript, event.response_id);
          }
          break;
        }

        default:
          // Skip unhandled events
          break;
      }
    },
    [processAIResponse, processUserVoiceTranscript]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioElement.current) {
        try {
          document.body.removeChild(audioElement.current);
        } catch (error) {
          // Error handling for removing audio element
        }
      }

      // Force cleanup of any remaining connections
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
      }
    };
  }, [cleanup]);

  // Auto-start when component becomes active
  useEffect(() => {
    if (isActive && !isConnected && !isConnecting) {
      isCleaningUp.current = false; // Reset cleanup flag
      startSession();
    } else if (!isActive && (isConnected || isConnecting)) {
      cleanup();
      onSessionEnd();
    }
  }, [
    isActive,
    isConnected,
    isConnecting,
    startSession,
    cleanup,
    onSessionEnd,
  ]);

  // Prevent any operations when session is ending
  useEffect(() => {
    if (!isActive) {
      isCleaningUp.current = true;

      // Cancel any ongoing operations
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      if (dataChannel.current) {
        dataChannel.current.close();
        dataChannel.current = null;
      }
    }
  }, [isActive]);

  // Call forceCleanup if provided when session ends
  useEffect(() => {
    if (!isActive && forceCleanup) {
      isCleaningUp.current = true; // Set cleanup flag immediately
      forceCleanup();
    }
  }, [isActive, forceCleanup]);

  // Force cleanup when isActive becomes false
  useEffect(() => {
    if (!isActive) {
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionStatus("Disconnected");
      cleanup();
      onSessionEnd();

      const cleanupTimeout = setTimeout(() => {
        if (!isActive) {
          cleanup();
          onSessionEnd();
        }
      }, 100);

      return () => clearTimeout(cleanupTimeout);
    }
  }, [isActive, cleanup, onSessionEnd]);

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
