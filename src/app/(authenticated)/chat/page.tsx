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
  Home,
  Phone,
  LogOut,
  AlertTriangle,
  UserPlus,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import MessageContent from "@/components/chat/MessageContent";
import Modal from "@/components/common/Modal";
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

const anxietyHelpers = [
  "When you feel worried, try taking three deep breaths with me. Ready? Breathe in... hold... breathe out...",
  "Sometimes when we're anxious, our thoughts race around. What's one thing you can see, hear, and feel right now?",
  "Anxiety can feel scary, but remember - you are safe right now. Your feelings are real, and they will pass.",
  "It's okay to feel anxious sometimes. Even adults feel this way. What usually helps you feel a little better?",
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
    const initialMessage = chatMode === "voice" 
      ? "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. You can talk to me naturally using your voice. What would you like to talk about today? 😊"
      : "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. What would you like to talk about today? 😊";
    
    return [{
      id: "1",
      content: initialMessage,
      sender: "ai",
      timestamp: new Date(),
    }];
  });

  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);
  const { lockSession } = useSessionLock();

  // Voice chat state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);

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

  // Check profile completeness on page load
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
        } else {
          setModalConfig(getModalConfig("error"));
        }
      } catch (error) {
        console.error("Error checking profile completeness:", error);
        setModalConfig(getModalConfig("connection"));
      }
    };

    checkProfileCompleteness();
  }, [getModalConfig]);

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
      console.error("Error analyzing mood with AI:", error);
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
      console.error("Error getting AI response:", error);

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
    setIsSessionActive(false);
    // Remove navigation prevention and allow redirect to session lock
    window.removeEventListener("popstate", () => {});
    window.removeEventListener("beforeunload", () => {});
    window.removeEventListener("keydown", () => {});
    window.removeEventListener("contextmenu", () => {});

    // Navigate to session lock page
    router.push("/session-lock");
  };

  // Voice chat functions
  const startRecording = async () => {
    try {
      // Request high-quality audio optimized for speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Lower sample rate is better for speech recognition
          channelCount: 1
        } 
      });
      
      // Try different MIME types for better compatibility - prioritize WebM with Opus for best quality
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
        await processVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording with smaller timeslice for better data handling
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      
      // Set a minimum recording duration (2 seconds) to ensure better transcription
      setTimeout(() => {
        if (isRecording) {
          console.log('Minimum recording duration reached');
        }
      }, 2000);
      
      // Update recording duration every second
      const durationInterval = setInterval(() => {
        if (isRecording) {
          setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000));
        }
      }, 1000);
      
      // Clean up interval when recording stops
      setTimeout(() => {
        clearInterval(durationInterval);
      }, 10000); // Max 10 seconds
      
      console.log('Recording started with MIME type:', mimeType);
    } catch (error) {
      console.error('Error starting recording:', error);
      setModalConfig({
        isOpen: true,
        title: "Microphone Access Required",
        message: "Please allow microphone access to use voice chat. You can enable it in your browser settings.",
        type: "warning",
        icon: <Mic className="h-6 w-6 text-yellow-600" />,
        primaryButton: {
          text: "OK",
          onClick: handleModalClose,
          className: "bg-yellow-600 hover:bg-yellow-700"
        }
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      // Ensure minimum recording duration for better transcription
      const recordingDuration = Date.now() - recordingStartTime;
      if (recordingDuration < 2000) { // Less than 2 seconds
        console.log('Recording too short, waiting for minimum duration...');
        setTimeout(() => {
          if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setIsProcessingVoice(true);
          }
        }, 2000 - recordingDuration);
      } else {
        mediaRecorder.stop();
        setIsRecording(false);
        setIsProcessingVoice(true);
        setRecordingDuration(0);
      }
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      console.log('Processing voice message, blob size:', audioBlob.size, 'type:', audioBlob.type);
      
      // Convert blob to base64 using a more reliable method
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Use a more efficient base64 conversion
      let binary = '';
      const len = uint8Array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      
      console.log('Audio converted to base64, length:', base64Audio.length);
      console.log('Base64 starts with:', base64Audio.substring(0, 50));
      console.log('Base64 ends with:', base64Audio.substring(base64Audio.length - 50));
      
      // Prepare message history for API
      const messageHistory = messages.map(msg => ({
        role: msg.sender === 'child' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      // Call voice chat API
      const response = await fetch('/api/chat/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          childId: selectedChildId,
          sessionId: `voice-session-${Date.now()}`,
          messageHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice message');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add user message (transcribed text)
        const userMessage: Message = {
          id: Date.now().toString(),
          content: data.transcribedText,
          sender: 'child',
          timestamp: new Date(),
        };
        
        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, userMessage, aiMessage]);
        
        // Play audio response if available
        if (data.audioResponse) {
          playAudioResponse(data.audioResponse);
        } else if (data.useClientTTS) {
          // Use client-side TTS as fallback
          console.log("Using client-side TTS as fallback");
          speakWithClientTTS(data.aiResponse);
        } else {
          // Show a notification that TTS is not available
          console.log("TTS not available - text response only");
        }
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      setModalConfig({
        isOpen: true,
        title: "Voice Processing Error",
        message: "Sorry, I couldn't process your voice message. Please try again or use text mode.",
        type: "error",
        icon: <AlertCircle className="h-6 w-6 text-red-600" />,
        primaryButton: {
          text: "OK",
          onClick: handleModalClose,
          className: "bg-red-600 hover:bg-red-700"
        }
      });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const playAudioResponse = (base64Audio: string) => {
    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up URL after playing
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error playing audio response:', error);
    }
  };

  // Client-side text-to-speech using Web Speech API
  const speakWithClientTTS = (text: string) => {
    try {
      console.log("Using client-side TTS to speak:", text);
      
      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
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
        const femaleVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('girl') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log("Using voice:", femaleVoice.name);
        } else {
          console.log("Using default voice");
        }
        
        // Add event listeners for better control
        utterance.onstart = () => {
          console.log("Client TTS started speaking");
        };
        
        utterance.onend = () => {
          console.log("Client TTS finished speaking");
        };
        
        utterance.onerror = (event) => {
          console.error("Client TTS error:", event.error);
        };
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
        
      } else {
        console.log("Speech synthesis not supported in this browser");
      }
    } catch (error) {
      console.error('Error with client-side TTS:', error);
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

  const handleEditChildFromContext = (childId: string) => {
    router.push(`/children/add?childId=${selectedChildId}`);
  };

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
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
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
                <div className="mb-4">
                  {isProcessingVoice ? (
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Loader2 className="h-10 w-10 text-white animate-spin" />
                    </div>
                  ) : (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessingVoice}
                      className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                        isRecording
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse'
                          : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
                      } ${isProcessingVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRecording ? (
                        <div className="w-6 h-6 bg-white rounded-sm"></div>
                      ) : (
                        <Mic className="h-10 w-10 text-white" />
                      )}
                    </button>
                  )}
                  
                                     <h3 className="text-lg font-bold text-purple-800 mb-2">
                     {isProcessingVoice 
                       ? "Processing your message..." 
                       : isRecording 
                         ? `Recording... ${recordingDuration}s` 
                         : "Voice Chat Mode"
                     }
                   </h3>
                  
                                     <p className="text-purple-600 mb-4">
                     {isProcessingVoice 
                       ? "Dr. Emma is listening and thinking about your message..."
                       : isRecording
                         ? "Speak clearly and naturally. Record for at least 2 seconds for best results."
                         : "Click the microphone to start talking to Dr. Emma. She'll listen and respond with her voice too!"
                     }
                   </p>
                  
                  {!isRecording && !isProcessingVoice && (
                    <div className="text-xs text-purple-500 mb-2">
                      💡 Voice responses may not be available in all environments
                    </div>
                  )}
                  
                  {!isRecording && !isProcessingVoice && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-purple-500">
                      <Shield className="h-3 w-3" />
                      <span>Your voice is private and secure</span>
                    </div>
                  )}
                </div>
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
