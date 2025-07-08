"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Send,
  Mic,
  Heart,
  Brain,
  Shield,
  Phone,
  LogOut,
  AlertTriangle,
  UserPlus,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import MessageContent from "@/components/chat/MessageContent";
import Modal from "@/components/common/Modal";
import ChildOnboardingModal from "@/components/common/ChildOnboardingModal";
import RealtimeVoiceChat from "@/components/chat/RealtimeVoiceChat";
import { useSessionLock } from "@/lib/session-lock-context";

interface Message {
  id: string;
  content: string;
  sender: "child" | "ai";
  timestamp: Date;
  mood?: {
    happiness: number;
    anxiety: number;
    sadness: number;
    stress: number;
    confidence: number;
  };
}

const supportiveResponses = [
  "I understand that can feel really hard. You're being so brave by talking to me about it.",
  "It sounds like you're dealing with some big feelings. That's completely normal.",
  "Thank you for sharing that with me. It takes courage to talk about difficult things.",
  "I can hear that this is important to you. Tell me more about how you're feeling.",
  "You're doing a great job expressing your feelings. That's a really important skill.",
];

// Loading component for Suspense fallback
function ChatLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-purple-700">Loading chat...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChildId = searchParams.get("childId");
  const chatMode = searchParams.get("mode") as "text" | "voice" | null;
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(
    initialChildId || undefined
  );
  const [messages, setMessages] = useState<Message[]>(() => {
    const initialMessage =
      chatMode === "voice"
        ? "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. You can talk to me naturally using your voice. What would you like to talk about today? 😊"
        : "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. What would you like to talk about today? 😊";

    return [
      {
        id: "1",
        content: initialMessage,
        sender: "ai",
        timestamp: new Date(),
      },
    ];
  });

  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { lockSession } = useSessionLock();

  // Voice chat state
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Real-time voice chat state
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const shouldStopVoiceChat = useRef(false);
  const [audioRecordingBuffer, setAudioRecordingBuffer] =
    useState<MediaRecorder | null>(null);
  const [voiceChatError, setVoiceChatError] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [voiceActivityLevel, setVoiceActivityLevel] = useState(0); // Voice activity indicator

  // OpenAI Realtime API state
  const [useOpenAIRealtime, setUseOpenAIRealtime] = useState(false);
  const [realtimeSessionActive, setRealtimeSessionActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(new Date());
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
    icon?: React.ReactNode;
    primaryButton?: {
      text: string;
      onClick: () => void;
      className?: string;
    };
    secondaryButton?: {
      text: string;
      onClick: () => void;
      className?: string;
    };
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Lock session and prevent navigation when chat page loads
  useEffect(() => {
    // Lock the session immediately when chat page loads
    lockSession();

    // Prevent browser back/forward navigation
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      // Push the current state back to prevent navigation
      window.history.pushState(null, "", window.location.href);
    };

    // Prevent page refresh and other navigation attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Session is active. Please use the 'End Session' button to exit safely.";
      return e.returnValue;
    };

    // Prevent keyboard shortcuts for navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+Shift+R, Alt+Left, Alt+Right
      if (
        e.key === "F5" ||
        (e.ctrlKey && e.key === "r") ||
        (e.ctrlKey && e.shiftKey && e.key === "R") ||
        (e.altKey && e.key === "ArrowLeft") ||
        (e.altKey && e.key === "ArrowRight")
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Push current state to prevent back navigation
    window.history.pushState(null, "", window.location.href);

    // Add event listeners
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    // Cleanup function
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [lockSession]);

  // Cleanup real-time voice chat on component unmount
  useEffect(() => {
    return () => {
      // Clean up real-time voice chat resources on unmount
      if (audioRecordingBuffer) {
        audioRecordingBuffer.stop();
      }
      if (audioContext) {
        audioContext.close();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioRecordingBuffer, audioContext, mediaStream]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(
        Math.floor((new Date().getTime() - startTime.current.getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Memoize modal handlers
  const handleModalClose = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleProfileCompletion = useCallback(
    (childId: string) => {
      handleModalClose();
      router.push(`/children/add?childId=${childId}`);
    },
    [handleModalClose, router]
  );

  const handleAddChild = () => {
    router.push("/children/add");
  };

  const handleLogin = useCallback(() => {
    handleModalClose();
    router.push("/auth/login");
  }, [handleModalClose, router]);

  const handleGoToDashboard = useCallback(() => {
    handleModalClose();
    router.push("/dashboard");
  }, [handleModalClose, router]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setOnboardingComplete(true);

    // Auto-start real-time voice chat if in voice mode
    if (chatMode === "voice") {
      // Use OpenAI Realtime API for better performance
      setUseOpenAIRealtime(true);
    }
  }, [chatMode]);

  const handleOnboardingClose = useCallback(() => {
    // Don't allow closing without completing onboarding
    // This ensures children must acknowledge the disclaimer
  }, []);

  // Handle messages from OpenAI Realtime API
  const handleRealtimeMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Handle realtime session start
  const handleRealtimeSessionStart = useCallback(() => {
    setRealtimeSessionActive(true);
    setIsRealTimeMode(true);
  }, []);

  // Handle realtime session end
  const handleRealtimeSessionEnd = useCallback(() => {
    setRealtimeSessionActive(false);
    setIsRealTimeMode(false);
  }, []);

  // Memoize modal config
  const getModalConfig = useCallback(
    (
      type: "profile" | "child" | "auth" | "error" | "connection",
      data?: any
    ) => {
      const configs = {
        profile: {
          isOpen: true,
          title: "Complete Profile Required",
          message:
            "Please complete your child's therapeutic profile before starting therapy sessions. This helps Dr. Emma provide personalized support.",
          type: "warning" as const,
          icon: <AlertTriangle className="h-6 w-6" />,
          primaryButton: {
            text: "Complete Profile",
            onClick: () => handleProfileCompletion(data.childId),
          },
          secondaryButton: {
            text: "Back to Dashboard",
            onClick: handleGoToDashboard,
          },
        },
        child: {
          isOpen: true,
          title: "Add Child Profile",
          message:
            "Please add a child profile first before accessing therapy sessions.",
          type: "info" as const,
          icon: <UserPlus className="h-6 w-6" />,
          primaryButton: {
            text: "Add Child",
            onClick: handleAddChild,
          },
        },
        auth: {
          isOpen: true,
          title: "Authentication Required",
          message: "Please log in to access therapy sessions.",
          type: "error" as const,
          icon: <AlertCircle className="h-6 w-6" />,
          primaryButton: {
            text: "Log In",
            onClick: handleLogin,
          },
        },
        error: {
          isOpen: true,
          title: "Profile Check Failed",
          message:
            "Unable to verify your child's profile. Please check your connection and try again.",
          type: "error" as const,
          icon: <AlertCircle className="h-6 w-6" />,
          primaryButton: {
            text: "Go to Dashboard",
            onClick: handleGoToDashboard,
          },
        },
        connection: {
          isOpen: true,
          title: "Connection Error",
          message:
            "Connection error. Please check your internet connection and try again.",
          type: "error" as const,
          icon: <AlertCircle className="h-6 w-6" />,
          primaryButton: {
            text: "Go to Dashboard",
            onClick: handleGoToDashboard,
          },
        },
      };
      return configs[type];
    },
    [handleProfileCompletion, handleAddChild, handleLogin, handleGoToDashboard]
  );

  // Check profile completeness on page load and auto-start voice chat
  useEffect(() => {
    const checkProfileCompleteness = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const childId = urlParams.get("childId");

        const response = await fetch(
          `/api/profile-check${childId ? `?childId=${childId}` : ""}`,
          {
            method: "GET",
          }
        );

        if (response.status === 422) {
          const data = await response.json();
          if (data.requiresProfileCompletion) {
            setModalConfig(
              getModalConfig("profile", { childId: data.childId })
            );
            return;
          }
        }

        if (response.status === 404) {
          const data = await response.json();
          if (data.requiresChildRegistration) {
            setModalConfig(getModalConfig("child"));
            return;
          }
        }

        if (response.status === 401) {
          setModalConfig(getModalConfig("auth"));
          return;
        }

        if (response.ok) {
          setProfileCheckComplete(true);

          // Show onboarding if not completed yet
          if (!onboardingComplete) {
            setShowOnboarding(true);
          } else {
            // Auto-start real-time voice chat if in voice mode
            if (chatMode === "voice") {
              // Use OpenAI Realtime API for better performance
              setUseOpenAIRealtime(true);
            }
          }
        } else {
          setModalConfig(getModalConfig("error"));
        }
      } catch (error) {
        setModalConfig(getModalConfig("connection"));
      }
    };

    checkProfileCompleteness();
  }, [chatMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Analyze mood using OpenAI API
  const analyzeMoodWithAI = async (message: string) => {
    try {
      const response = await fetch("/api/mood-tracking", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId: selectedChildId,
          moodDescription: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.moodAnalysis;
      }
    } catch (error) {
      // Silent error handling
    }

    // Fallback to neutral scores if AI analysis fails
    return {
      happiness: 5,
      anxiety: 5,
      sadness: 5,
      stress: 5,
      confidence: 5,
      insights: "Unable to analyze mood - using neutral baseline scores",
    };
  };

  const generateAIResponse = async (
    userMessage: string,
    messageHistory: Message[]
  ) => {
    setIsLoading(true);

    try {
      if (!selectedChildId) {
        throw new Error("No child selected");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: messageHistory.slice(-10), // Send last 10 messages for context
          childId: selectedChildId,
        }),
      });

      if (response.status === 422) {
        // Profile completion required
        const data = await response.json();
        if (data.requiresProfileCompletion) {
          router.push(`/children/add?childId=${selectedChildId}`);
          return "Redirecting you to complete the therapeutic profile...";
        }
      }

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Check if the response indicates crisis content
      if (data.hasAlert && data.alert_level === "high") {
        setShowCrisisHelp(true);
      }

      return data.response;
    } catch (error) {
      // Fallback to supportive responses
      return supportiveResponses[
        Math.floor(Math.random() * supportiveResponses.length)
      ];
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    if (!selectedChildId) {
      // Show modal to select a child
      setModalConfig({
        isOpen: true,
        title: "Select a Child",
        message: "Please select a child to chat with before sending a message.",
        type: "info",
        icon: <UserPlus className="h-6 w-6" />,
        primaryButton: {
          text: "Add Child",
          onClick: handleAddChild,
        },
        secondaryButton: {
          text: "Cancel",
          onClick: handleModalClose,
        },
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: "child",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsTyping(true);

    // Analyze mood with AI
    const moodAnalysis = await analyzeMoodWithAI(currentMessage);
    userMessage.mood = moodAnalysis;

    // Simulate typing delay
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(currentMessage, messages);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);

      // Session is automatically saved in the chat API - no need for separate call
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const endSession = () => {
    // Stop voice chat if it's running
    if (isRealTimeMode) {
      if (useOpenAIRealtime) {
        // Stop OpenAI Realtime session
        setUseOpenAIRealtime(false);
        setRealtimeSessionActive(false);
      } else {
        // Stop legacy voice chat
        stopRealTimeVoiceChat();
      }
    }

    // Remove navigation prevention and allow redirect to session lock
    window.removeEventListener("popstate", () => {});
    window.removeEventListener("beforeunload", () => {});
    window.removeEventListener("keydown", () => {});
    window.removeEventListener("contextmenu", () => {});

    // Navigate to session lock page immediately
    // Voice chat will be stopped and any ongoing processing will be aborted
    router.push("/session-lock");
  };

  const playAudioResponse = (base64Audio: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if voice chat should be stopped
      if (shouldStopVoiceChat.current) {
        resolve();
        return;
      }

      try {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        // Check again before playing
        if (!shouldStopVoiceChat.current) {
          audio.play();
        } else {
          URL.revokeObjectURL(audioUrl);
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Client-side text-to-speech using Web Speech API
  const speakWithClientTTS = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if voice chat should be stopped
      if (shouldStopVoiceChat.current) {
        resolve();
        return;
      }

      try {
        // Check if speech synthesis is supported
        if ("speechSynthesis" in window) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          // Create a new speech utterance
          const utterance = new SpeechSynthesisUtterance(text);

          // Configure speech settings for a child-friendly voice
          utterance.rate = 0.9; // Slightly slower for clarity
          utterance.pitch = 1.1; // Slightly higher pitch for friendliness
          utterance.volume = 1.0; // Full volume

          // Try to get a female voice for Dr. Emma
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("woman") ||
              voice.name.toLowerCase().includes("girl") ||
              voice.name.toLowerCase().includes("samantha") ||
              voice.name.toLowerCase().includes("victoria")
          );

          if (femaleVoice) {
            utterance.voice = femaleVoice;
          }

          // Add event listeners for better control
          utterance.onstart = () => {
            // Silent start
          };

          utterance.onend = () => {
            resolve();
          };

          utterance.onerror = (event) => {
            reject(event.error);
          };

          // Check again before speaking
          if (!shouldStopVoiceChat.current) {
            window.speechSynthesis.speak(utterance);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Real-time voice chat functions
  const startRealTimeVoiceChat = async () => {
    try {
      // Reset stop flag
      shouldStopVoiceChat.current = false;

      // Request high-quality audio optimized for English speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Higher sample rate for better quality
          channelCount: 1, // Mono channel for better English speech processing
          // Browser-specific optimizations for better voice accuracy
          ...(navigator.userAgent.includes("Chrome") && {
            googEchoCancellation: true,
            googAutoGainControl: true,
            googNoiseSuppression: true,
            googHighpassFilter: true,
            googTypingNoiseDetection: true,
            googAudioMirroring: false,
          }),
        },
      });

      setMediaStream(stream);

      // Create audio context for analysis
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setAudioContext(audioCtx);

      // Create analyser node for silence detection
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.3;

      // Connect audio stream to analyser
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserNode);

      // Set up MediaRecorder for continuous recording
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/mp4";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "";
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
      });

      setAudioRecordingBuffer(recorder);
      setIsRealTimeMode(true);

      // Start continuous recording and silence detection
      startContinuousRecording(recorder, analyserNode, stream);
    } catch (error) {
      console.log("Error starting real-time voice chat:", error);
      setVoiceChatError(true);
      setIsRealTimeMode(false);
    }
  };

  const stopRealTimeVoiceChat = () => {
    // Set flag to stop voice chat
    shouldStopVoiceChat.current = true;

    // Abort any ongoing API calls
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop all audio processes
    if (audioRecordingBuffer) {
      audioRecordingBuffer.stop();
      setAudioRecordingBuffer(null);
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close();
      setAudioContext(null);
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }

    setIsRealTimeMode(false);
    setIsProcessingVoice(false);
    setVoiceChatError(false);
  };

  const startContinuousRecording = (
    recorder: MediaRecorder,
    analyserNode: AnalyserNode,
    stream: MediaStream
  ) => {
    let chunks: Blob[] = [];
    let isCurrentlyRecording = false;
    let isCurrentlyProcessing = false;
    let isRealTimeModeActive = true;
    let recordingStartTime = Date.now();

    // Enhanced voice detection parameters for better accuracy
    const SILENCE_THRESHOLD = 3;
    const MAX_RECORDING_DURATION = 15000;
    const MIN_RECORDING_DURATION = 1000;

    // Voice activity detection variables
    let voiceActivityBuffer: number[] = [];
    let consecutiveVoiceFrames = 0;
    let consecutiveSilenceFrames = 0;
    const SILENCE_FRAME_THRESHOLD = 15;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (chunks.length > 0) {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });

        // Set local processing state
        isCurrentlyProcessing = true;
        setIsProcessingVoice(true);

        // Process the audio chunk
        await processVoiceChunk(audioBlob);

        // Reset processing state
        isCurrentlyProcessing = false;
        setIsProcessingVoice(false);

        // Reset chunks for next recording
        chunks = [];
      }

      // Resume recording after processing (if still in real-time mode and not stopped)
      if (
        isRealTimeModeActive &&
        !isCurrentlyProcessing &&
        stream &&
        !shouldStopVoiceChat.current
      ) {
        setTimeout(async () => {
          if (isRealTimeModeActive && !shouldStopVoiceChat.current) {
            try {
              // Check if stream is still active, if not, recreate it
              let activeStream = stream;
              if (
                !stream.getTracks().some((track) => track.readyState === "live")
              ) {
                try {
                  activeStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true,
                      sampleRate: 48000, // Higher sample rate for better quality
                      channelCount: 1, // Mono channel for better English speech processing
                      // Browser-specific optimizations for better voice accuracy
                      ...(navigator.userAgent.includes("Chrome") && {
                        googEchoCancellation: true,
                        googAutoGainControl: true,
                        googNoiseSuppression: true,
                        googHighpassFilter: true,
                        googTypingNoiseDetection: true,
                        googAudioMirroring: false,
                      }),
                    },
                  });
                } catch (streamError) {
                  return;
                }
              }

              // Create a new MediaRecorder for the next cycle
              let mimeType = "audio/webm;codecs=opus";
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "audio/webm";
              }
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "audio/mp4";
              }
              if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = "";
              }

              const newRecorder = new MediaRecorder(activeStream, {
                mimeType: mimeType || undefined,
              });

              setAudioRecordingBuffer(newRecorder);
              startContinuousRecording(newRecorder, analyserNode, activeStream);
            } catch (error) {
              // Silent error handling
            }
          }
        }, 1000); // Brief pause before resuming
      }
    };

    // Start recording
    try {
      recorder.start(100); // Collect data every 100ms
      isCurrentlyRecording = true;
    } catch (error) {
      console.error("Error starting MediaRecorder:", error);
      return;
    }

    // Enhanced audio frequency detection for better voice accuracy
    const detectAudioFrequency = () => {
      if (
        !isRealTimeModeActive ||
        !analyserNode ||
        !isCurrentlyRecording ||
        shouldStopVoiceChat.current
      ) {
        return;
      }

      try {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        // Enhanced volume calculation with frequency weighting
        let weightedSum = 0;
        let totalWeight = 0;

        // Focus on human speech frequencies (85Hz - 255Hz for fundamental, 255Hz - 2000Hz for harmonics)
        for (let i = 0; i < bufferLength; i++) {
          const frequency = (i * 22050) / bufferLength; // Approximate frequency for this bin
          const amplitude = dataArray[i];

          // Weight frequencies in human speech range more heavily
          let weight = 1;
          if (frequency >= 85 && frequency <= 255) {
            weight = 2; // Fundamental speech frequencies
          } else if (frequency >= 255 && frequency <= 2000) {
            weight = 1.5; // Speech harmonics
          } else if (frequency > 2000) {
            weight = 0.5; // Reduce weight for high frequencies
          }

          weightedSum += amplitude * weight;
          totalWeight += weight;
        }

        const weightedAverage = weightedSum / totalWeight;
        const currentTime = Date.now();
        const recordingElapsed = currentTime - recordingStartTime;

        // Add to voice activity buffer
        voiceActivityBuffer.push(weightedAverage);
        if (voiceActivityBuffer.length > 30) {
          // Keep last 30 frames
          voiceActivityBuffer.shift();
        }

        // Calculate voice activity level
        const recentActivity =
          voiceActivityBuffer.slice(-10).reduce((sum, val) => sum + val, 0) /
          10;
        const isVoiceActive = recentActivity > SILENCE_THRESHOLD;

        // Update voice activity level for visual feedback (0-100)
        const activityPercentage = Math.min(100, (recentActivity / 50) * 100);
        setVoiceActivityLevel(activityPercentage);

        // Update consecutive frame counters
        if (isVoiceActive) {
          consecutiveVoiceFrames++;
          consecutiveSilenceFrames = 0;
        } else {
          consecutiveSilenceFrames++;
          consecutiveVoiceFrames = 0;
        }

        // Enhanced recording logic
        if (recordingElapsed >= MAX_RECORDING_DURATION) {
          // Maximum duration reached
          if (isCurrentlyRecording) {
            recorder.stop();
            isCurrentlyRecording = false;
          }
          return;
        }

        // Check for sufficient voice activity before stopping
        if (
          consecutiveSilenceFrames >= SILENCE_FRAME_THRESHOLD &&
          recordingElapsed >= MIN_RECORDING_DURATION
        ) {
          // Sufficient silence detected after minimum recording time
          if (isCurrentlyRecording) {
            recorder.stop();
            isCurrentlyRecording = false;
          }
          return;
        }

        // Continue detecting if still in real-time mode and not stopped
        if (
          isRealTimeModeActive &&
          isCurrentlyRecording &&
          !shouldStopVoiceChat.current
        ) {
          requestAnimationFrame(detectAudioFrequency);
        }
      } catch (error) {
        console.error("Error in audio frequency detection:", error);
        // Continue the loop even if there's an error
        if (
          isRealTimeModeActive &&
          isCurrentlyRecording &&
          !shouldStopVoiceChat.current
        ) {
          requestAnimationFrame(detectAudioFrequency);
        }
      }
    };

    // Start the audio frequency detection loop
    requestAnimationFrame(detectAudioFrequency);
  };

  const processVoiceChunk = async (audioBlob: Blob) => {
    if (isProcessingVoice) return; // Prevent multiple simultaneous processing

    // Check if voice chat should be stopped
    if (shouldStopVoiceChat.current) {
      return;
    }

    try {
      setIsProcessingVoice(true);

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      let binary = "";
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);

      // Prepare message history for API
      const messageHistory = messages.map((msg) => ({
        role: msg.sender === "child" ? "user" : "assistant",
        content: msg.content,
      }));

      // Call voice chat API with abort controller
      const response = await fetch("/api/chat/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioData: base64Audio,
          childId: selectedChildId,
          sessionId: `realtime-voice-session-${Date.now()}`,
          messageHistory,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to process voice message");
      }

      const data = await response.json();

      if (data.success) {
        // Only add messages if there's actual content
        if (data.transcribedText && data.transcribedText.trim().length > 0) {
          // Add user message (transcribed text)
          const userMessage: Message = {
            id: Date.now().toString(),
            content: data.transcribedText,
            sender: "child",
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, userMessage]);

          // Only add AI response if there's actual AI content
          if (data.aiResponse && data.aiResponse.trim().length > 0) {
            // Add AI response
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: data.aiResponse,
              sender: "ai",
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMessage]);

            // Play audio response if available (only if voice chat is still active)
            if (!shouldStopVoiceChat.current) {
              if (data.audioResponse) {
                await playAudioResponse(data.audioResponse);
              } else if (data.useClientTTS) {
                await speakWithClientTTS(data.aiResponse);
              }
            }
          }
        }
      }
    } catch (error) {
      // Check if this is an abort error (voice chat stopped)
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      // Silent error handling for real-time mode
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Memoize the loading state JSX
  const loadingState = useMemo(
    () => (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-purple-900 mb-2">
              Preparing Dr. Emma...
            </h2>
            <p className="text-purple-600">Checking your therapeutic profile</p>
          </div>
        </div>
        {modalConfig.isOpen && (
          <Modal
            isOpen={modalConfig.isOpen}
            onClose={handleModalClose}
            title={modalConfig.title}
            type={modalConfig.type}
            icon={modalConfig.icon}
            primaryButton={modalConfig.primaryButton}
            secondaryButton={modalConfig.secondaryButton}
            hideCloseButton={true}
          >
            {modalConfig.message}
          </Modal>
        )}
      </>
    ),
    [modalConfig, handleModalClose]
  );

  // Show loading state while checking profile completeness
  if (!profileCheckComplete) {
    return loadingState;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-mental-health-pulse">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1
                  className="text-xl font-bold text-purple-800"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Dr. Emma AI
                </h1>
                <p className="text-sm text-purple-600">
                  Your Safe Space to Talk
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">
                  Online & Listening
                </span>
              </div>
              {/* Mode Indicator */}
              <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-full">
                {chatMode === "voice" ? (
                  <svg
                    className="h-3 w-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="23" />
                    <line x1="8" x2="16" y1="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="h-3 w-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
                <span className="text-xs font-medium text-blue-700">
                  {chatMode === "voice" ? "Voice Mode" : "Text Mode"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-700">
                    Session Time
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatTime(sessionDuration)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={endSession}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>End Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Chat Area */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-purple-200 overflow-hidden">
          {/* Safety Notice */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-3 border-b border-purple-100">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-purple-700 font-medium">Safe Space:</span>
                <span className="text-purple-600">
                  Everything you share is private and secure. Dr. Emma is here
                  to help! 💜
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Lock className="h-3 w-3 text-purple-600" />
                <span className="text-purple-600">
                  Navigation locked for safety
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "child" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                    message.sender === "child"
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-tr-md"
                      : "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 rounded-tl-md"
                  }`}
                >
                  {message.sender === "ai" && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-purple-700">
                        Dr. Emma
                      </span>
                    </div>
                  )}
                  {message.sender === "ai" ? (
                    <MessageContent content={message.content} />
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <p className="text-xs opacity-75 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                      <Heart className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-700">
                      Dr. Emma
                    </span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-purple-100 p-6">
            {chatMode === "voice" ? (
              /* Voice Mode Interface */
              <div className="text-center">
                {useOpenAIRealtime ? (
                  /* OpenAI Realtime API Interface */
                  <RealtimeVoiceChat
                    childId={selectedChildId || ""}
                    onMessageReceived={handleRealtimeMessage}
                    onSessionStart={handleRealtimeSessionStart}
                    onSessionEnd={handleRealtimeSessionEnd}
                    isActive={useOpenAIRealtime}
                  />
                ) : (
                  /* Legacy Voice Mode Interface */
                  <div className="mb-4">
                    {isProcessingVoice ? (
                      /* Processing state */
                      <div>
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-800 mb-2">
                          Processing your message...
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Dr. Emma is listening and thinking about your
                          message...
                        </p>
                      </div>
                    ) : isRealTimeMode ? (
                      /* Listening state */
                      <div>
                        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <div
                            className="w-4 h-4 bg-white rounded-full animate-ping"
                            style={{
                              transform: `scale(${
                                1 + (voiceActivityLevel / 100) * 0.5
                              })`,
                              opacity: 0.5 + (voiceActivityLevel / 100) * 0.5,
                            }}
                          ></div>
                        </div>
                        <h3 className="text-lg font-bold text-purple-800 mb-2">
                          Listening...
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Speak naturally in English! Dr. Emma detects when you
                          pause and responds automatically.
                        </p>
                        <div className="mb-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-center space-x-2 text-sm text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span>Listening for your voice...</span>
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Pause for 2 seconds to send your message
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : voiceChatError ? (
                      /* Error state - show retry button */
                      <div>
                        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Mic className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-800 mb-2">
                          Voice Chat Unavailable
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Unable to start voice chat. Please check your
                          microphone permissions.
                        </p>
                        <button
                          onClick={() => {
                            setVoiceChatError(false);
                            startRealTimeVoiceChat();
                          }}
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                          🔄 Try Again
                        </button>
                      </div>
                    ) : (
                      /* Initial state - auto-start voice chat */
                      <div>
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Loader2 className="h-10 w-10 text-white animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold text-purple-800 mb-2">
                          Starting Voice Chat...
                        </h3>
                        <p className="text-purple-600 mb-4">
                          Preparing your voice chat session...
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-center space-x-2 text-xs text-purple-500">
                      <Shield className="h-3 w-3" />
                      <span>
                        Your voice is private and secure • English only
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Text Mode Interface */
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Share what's on your mind... 💭"
                      className="w-full bg-purple-50 border border-purple-200 rounded-2xl px-4 py-3 text-purple-900 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-2xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-purple-600">
                  <p>
                    💜 Dr. Emma listens without judgment and keeps everything
                    private
                  </p>
                  <p>Press Enter to send</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Crisis Help Modal */}
      {showCrisisHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border-4 border-red-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-4">
                Let's Get You Help Right Away
              </h3>
              <p className="text-gray-700 mb-6">
                It sounds like you might need to talk to someone right now.
                You're brave for sharing your feelings.
              </p>

              <div className="space-y-4 mb-6">
                <div className="bg-red-50 p-4 rounded-lg text-left">
                  <p className="font-bold text-red-800">Crisis Text Line</p>
                  <p className="text-red-700">Text HOME to 741741</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  <p className="font-bold text-blue-800">Call for Help</p>
                  <p className="text-blue-700">
                    988 - Suicide & Crisis Lifeline
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => window.open("tel:988")}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  Call 988 Now
                </button>
                <button
                  onClick={() => setShowCrisisHelp(false)}
                  className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Continue Talking to Dr. Emma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Child Onboarding Modal */}
      <ChildOnboardingModal
        isOpen={showOnboarding}
        onContinue={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />

      {/* Modal for child selection and other alerts */}
      {modalConfig.isOpen && (
        <Modal
          isOpen={modalConfig.isOpen}
          onClose={handleModalClose}
          title={modalConfig.title}
          type={modalConfig.type}
          icon={modalConfig.icon}
          primaryButton={modalConfig.primaryButton}
          secondaryButton={modalConfig.secondaryButton}
        >
          {modalConfig.message}
        </Modal>
      )}
    </>
  );
}

export default function ChildChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
