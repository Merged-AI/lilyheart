"use client";

import { useState, useRef, useEffect, useMemo, useCallback, Suspense } from "react";
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
} from "lucide-react";
import Link from "next/link";
import MessageContent from "@/components/chat/MessageContent";
import Modal from "@/components/common/Modal";
import { ChildSelector } from "@/components/dashboard/child-selector";

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
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(
    initialChildId || undefined
  );
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. What would you like to talk about today? 😊",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisHelp, setShowCrisisHelp] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [profileCheckComplete, setProfileCheckComplete] = useState(false);

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
      router.push(`/add-child?childId=${childId}`);
    },
    [handleModalClose, router]
  );

  const handleChildSelect = useCallback((childId: string) => {
    setSelectedChildId(childId);
    // Clear messages when switching children to start fresh
    setMessages([
      {
        id: "1",
        content:
          "Hi there! I'm Dr. Emma, your AI friend. I'm here to listen and help you with any feelings or thoughts you want to share. What would you like to talk about today? 😊",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  }, []);

  const handleAddChild = useCallback(() => {
    router.push("/add-child");
  }, [router]);

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
          router.push(`/add-child?childId=${selectedChildId}`);
          return "Redirecting you to complete the therapeutic profile...";
        }
      }

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      
      // Check if the response indicates crisis content
      if (data.hasAlert && data.alert_level === 'high') {
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
    router.push("/session-lock");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
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
                <Link
                  href="/dashboard"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>End Session</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Session End Button */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={endSession}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <LogOut className="h-4 w-4" />
          <span>End Session</span>
        </button>
      </div>
      {/* Chat Area */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl border border-purple-200 overflow-hidden">
          {/* Safety Notice */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-3 border-b border-purple-100">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-purple-600" />
              <span className="text-purple-700 font-medium">Safe Space:</span>
              <span className="text-purple-600">
                Everything you share is private and secure. Dr. Emma is here to
                help! 💜
              </span>
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
    </div>
  );
}

export default function ChildChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
