"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Loader2, AlertCircle } from "lucide-react";
import { apiPost } from "@/lib/api";

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

  // Turn-taking synchronization state
  const [aiIsResponding, setAiIsResponding] = useState(false);
  const [isWaitingForAIResponse, setIsWaitingForAIResponse] = useState(false);

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

  // Turn-taking refs
  const aiIsRespondingRef = useRef<boolean>(false);
  const pendingUserMessageRef = useRef<string>("");
  const currentTurnId = useRef<string>("");
  const turnStartTime = useRef<number>(0);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const TURN_TIMEOUT = 30000; // 30 seconds timeout for AI response

  // Cleanup function
  const cleanup = useCallback(() => {
    isCleaningUp.current = true;
    setIsInputCooldown(false);
    setIsResponseCooldown(false);
    setAiIsResponding(false);
    setIsWaitingForAIResponse(false);

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

    // Reset turn-taking state
    aiIsRespondingRef.current = false;
    pendingUserMessageRef.current = "";
    currentTurnId.current = "";
    turnStartTime.current = 0;

    // Clear any pending timeouts
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }

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
        const result = await apiPost<{ sessionId?: string }>(
          "chat/realtime-proxy",
          {
            event: "store_user_message",
            childId,
            data: {
              content,
            },
          }
        );

        if (result.sessionId) {
          pendingSessionId.current = result.sessionId;
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
        const result = await apiPost<any>("chat/realtime-proxy", {
          event: "store_ai_response",
          childId,
          data: {
            sessionId: pendingSessionId.current,
            content,
            userMessage: pendingUserMessage.current,
          },
        });

        // Clear pending data after successful storage
        pendingSessionId.current = "";
        pendingUserMessage.current = "";
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
    console.log("transcript :", transcript);
    if (!transcript || transcript.trim() === "" || isInputCooldown) {
      return;
    }

    // Normalize and clean the transcript
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Enhanced filtering for meaningful speech
    // Ignore very short or meaningless transcripts
    if (normalizedTranscript.length < 5) {
      return;
    }

    // Filter out common non-speech sounds and filler words
    const fillerWords = [
      "mm",
      "hmm",
      "um",
      "uh",
      "ah",
      "oh",
      "eh",
      "er",
      "erm",
      "mmm",
      "uhm",
      "uhh",
      "hm",
      "mhm",
      "yeah",
      "ya",
      "yep",
      "ok",
      "okay",
      "alright",
      "sure",
      "right",
      "well",
      "like",
      "so",
      "and",
      "but",
      "the",
      "a",
      "an",
      "is",
      "was",
    ];

    // Check if transcript is only filler words
    const words = normalizedTranscript
      .split(/\s+/)
      .filter((word) => word.length > 0);
    if (words.length === 0) {
      return;
    }

    // If transcript contains only filler words, ignore it
    const meaningfulWords = words.filter((word) => !fillerWords.includes(word));
    if (meaningfulWords.length === 0) {
      return;
    }

    // Require at least 2 meaningful words for a valid input
    if (meaningfulWords.length < 2 && !normalizedTranscript.includes("?")) {
      return;
    }

    // Check for repetitive patterns (like "hello hello hello")
    const uniqueWords = Array.from(new Set(words));
    if (words.length > 2 && uniqueWords.length === 1) {
      return;
    }

    // Filter out transcripts that are just punctuation or single characters
    if (/^[^\w\s]*$/.test(normalizedTranscript)) {
      return;
    }

    // TURN-TAKING CHECK: Don't process if AI is currently responding
    if (aiIsRespondingRef.current || isWaitingForAIResponse) {
      pendingUserMessageRef.current = transcript;
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

    // Additional validation for meaningful speech
    // Check if the transcript contains at least one verb or noun-like word
    const meaningfulPatterns = [
      /\b(feel|feeling|felt|think|thought|want|need|like|love|hate|scared|happy|sad|angry|worried|help|play|talk|tell|ask|said|say|go|going|went|come|coming|came|do|doing|did|have|had|am|are|was|were|will|would|could|should|can|may|might)\b/i,
      /\b(mom|dad|school|friend|teacher|home|family|child|kid|today|yesterday|tomorrow|now|here|there|why|what|when|where|how|who)\b/i,
    ];

    const hasNaturalSpeech = meaningfulPatterns.some((pattern) =>
      pattern.test(transcript)
    );

    // If no meaningful patterns and not a question, require longer transcript
    if (
      !hasNaturalSpeech &&
      !transcript.includes("?") &&
      meaningfulWords.length < 3
    ) {
      return;
    }

    // Set turn-taking state
    aiIsRespondingRef.current = true;
    setIsWaitingForAIResponse(true);
    currentTurnId.current = Date.now().toString();
    turnStartTime.current = now;

    const userMessage: Message = {
      id: currentTurnId.current,
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

        // TURN-TAKING: Complete the current turn and allow next user input
        aiIsRespondingRef.current = false;
        setIsWaitingForAIResponse(false);
        setAiIsResponding(false);

        // Clear timeout since AI response completed
        if (turnTimeoutRef.current) {
          clearTimeout(turnTimeoutRef.current);
          turnTimeoutRef.current = null;
        }

        // Process any pending user message that was queued during AI response
        if (pendingUserMessageRef.current) {
          const pendingMessage = pendingUserMessageRef.current;
          pendingUserMessageRef.current = "";

          // Process the pending message after a short delay to ensure turn completion
          setTimeout(() => {
            processUserVoiceTranscript(pendingMessage);
          }, 500);
        }

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
      processUserVoiceTranscript,
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

      // Reset turn-taking state for new session
      aiIsRespondingRef.current = false;
      pendingUserMessageRef.current = "";
      currentTurnId.current = "";
      turnStartTime.current = 0;
      setAiIsResponding(false);
      setIsWaitingForAIResponse(false);

      // Clear any existing timeouts
      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
        turnTimeoutRef.current = null;
      }

      // Create session through backend
      const sessionResponse = await apiPost<{ response: any }>(
        "chat/realtime-proxy",
        {
          event: "create_session",
          childId,
        }
      );

      const EPHEMERAL_KEY = sessionResponse.response.client_secret.value;

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

      // Get user's microphone with optimized settings for better voice detection
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 24000, // Reduced sample rate for better compatibility
        channelCount: 1,
        sampleSize: 16,
      };

      // Add Google-specific constraints if available (for Chrome)
      try {
        const constraints = navigator.mediaDevices.getSupportedConstraints();
        if ("googEchoCancellation" in constraints) {
          (audioConstraints as any).googEchoCancellation = true;
          (audioConstraints as any).googNoiseSuppression = true;
          (audioConstraints as any).googAutoGainControl = true;
          (audioConstraints as any).googHighpassFilter = true;
          (audioConstraints as any).googTypingNoiseDetection = true;
        }
      } catch (e) {
        // Ignore if not supported
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
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
      const answerResponse = await apiPost<{ response: string }>(
        "chat/realtime-proxy",
        {
          event: "send_sdp_offer",
          childId,
          data: {
            sdp: offer.sdp,
            model: "gpt-4o-realtime-preview-2024-12-17",
            ephemeralKey: EPHEMERAL_KEY,
          },
        }
      );

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: answerResponse.response,
      };

      await pc.setRemoteDescription(answer);
    } catch (err) {
      console.error("Voice chat session error:", err);
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
      const result = await apiPost<{ response: string }>(
        "chat/realtime-proxy",
        {
          event: "get_child_context",
          childId,
        }
      );

      const contextEvent = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: `You are Dr. Emma, a caring child therapist. IMPORTANT: Always respond in English only. Here's the child's therapeutic profile: ${result.response}. Keep responses warm, age-appropriate, and therapeutic. Focus on emotional validation and gentle guidance. Use the child's name when appropriate and reference their specific concerns and background. Wait for the child to speak first before responding.`,
            },
          ],
        },
      };

      dataChannel.current.send(JSON.stringify(contextEvent));
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

        // TURN-TAKING EVENTS
        case "turn_start":
          {
            setAiIsResponding(true);
            aiIsRespondingRef.current = true;
            turnStartTime.current = Date.now();

            // Set timeout to prevent getting stuck
            if (turnTimeoutRef.current) {
              clearTimeout(turnTimeoutRef.current);
            }
            turnTimeoutRef.current = setTimeout(() => {
              setAiIsResponding(false);
              aiIsRespondingRef.current = false;
              setIsWaitingForAIResponse(false);

              // Process any pending user message
              if (pendingUserMessageRef.current) {
                const pendingMessage = pendingUserMessageRef.current;
                pendingUserMessageRef.current = "";
                processUserVoiceTranscript(pendingMessage);
              }
            }, TURN_TIMEOUT);
          }
          break;

        case "turn_stop":
          {
            setAiIsResponding(false);
            aiIsRespondingRef.current = false;
            setIsWaitingForAIResponse(false);

            // Clear timeout since turn completed normally
            if (turnTimeoutRef.current) {
              clearTimeout(turnTimeoutRef.current);
              turnTimeoutRef.current = null;
            }

            // Process any pending user message
            if (pendingUserMessageRef.current) {
              const pendingMessage = pendingUserMessageRef.current;
              pendingUserMessageRef.current = "";

              setTimeout(() => {
                processUserVoiceTranscript(pendingMessage);
              }, 300);
            }
          }
          break;

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

            // Enhanced validation before processing transcript
            if (finalTranscript && finalTranscript.trim() !== "") {
              // Additional check for meaningful content
              const cleanTranscript = finalTranscript.trim();

              // Skip if transcript appears to be just noise or background sound
              if (
                cleanTranscript.length >= 5 &&
                !/^[^\w]*$/.test(cleanTranscript)
              ) {
                processUserVoiceTranscript(finalTranscript);
              }

              // Clean up the buffer
              if (event.item_id) {
                transcriptBuffer.current.delete(event.item_id);
              }
            }
          }
          break;

        case "input_audio_buffer.committed":
          if (event.transcript && event.transcript.trim().length >= 5) {
            // Only process if transcript has meaningful content
            const cleanTranscript = event.transcript.trim();
            if (!/^[^\w]*$/.test(cleanTranscript)) {
              processUserVoiceTranscript(event.transcript);
            }
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
  }, []);

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
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              aiIsResponding || isWaitingForAIResponse
                ? "bg-yellow-500 animate-pulse"
                : "bg-green-500"
            }`}
          >
            <Mic className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-green-700 mb-2">
            Connected to Dr. Emma
          </h3>
          <p className="text-green-600 mb-4">
            {aiIsResponding || isWaitingForAIResponse
              ? "Dr. Emma is responding... Please wait."
              : "Speak naturally! Dr. Emma is listening and will respond in real-time."}
          </p>
          {aiIsResponding && (
            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded-lg">
              ⏳ Turn-taking active - waiting for Dr. Emma to finish
            </div>
          )}
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
