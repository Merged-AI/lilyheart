"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import Modal from "./Modal";

interface ChatModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId?: string;
}

type ChatMode = "text" | "voice";

export default function ChatModeModal({
  isOpen,
  onClose,
  childId,
}: ChatModeModalProps) {
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalConfig, setProfileModalConfig] = useState<{
    title: string;
    message: string;
    type: "warning" | "info" | "error";
    icon: React.ReactNode;
    primaryButton: {
      text: string;
      onClick: () => void;
    };
    secondaryButton?: {
      text: string;
      onClick: () => void;
    };
  } | null>(null);

  const handleProfileCompletion = (childId: string) => {
    setShowProfileModal(false);
    onClose();
    router.push(`/children/add?childId=${childId}`);
  };

  const handleAddChild = () => {
    setShowProfileModal(false);
    onClose();
    router.push("/children/add");
  };

  const handleGoToDashboard = () => {
    setShowProfileModal(false);
    onClose();
    router.push("/dashboard");
  };

  const checkProfileBeforeChat = async (mode: ChatMode) => {
    setIsCheckingProfile(true);

    try {
      // First check subscription status
      const subscriptionResponse = await fetch(
        "/api/stripe/subscription-status"
      );

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();

        // Calculate subscription status from the response data
        const hasActiveSubscription =
          subscriptionData.hasSubscription &&
          (subscriptionData.subscription?.status === "active" ||
            subscriptionData.family?.subscription_status === "active");
        const isTrialing =
          subscriptionData.hasSubscription &&
          (subscriptionData.subscription?.status === "trialing" ||
            subscriptionData.family?.subscription_status === "trialing");
        const trialEnded = subscriptionData.family?.trial_ends_at
          ? new Date(subscriptionData.family.trial_ends_at) < new Date() &&
            !hasActiveSubscription
          : false;

        // Check if subscription is required
        if (!hasActiveSubscription && !isTrialing) {
          setProfileModalConfig({
            title: "Subscription Required",
            message:
              "A subscription is required to access therapy sessions. You can manage your subscription from your profile.",
            type: "warning",
            icon: <AlertTriangle className="h-6 w-6" />,
            primaryButton: {
              text: "Manage Subscription",
              onClick: () => {
                setShowProfileModal(false);
                onClose();
                router.push("/profile");
              },
            },
          });
          setShowProfileModal(true);
          setIsCheckingProfile(false);
          onClose();
          return;
        }
      }

      // Then check profile
      const response = await fetch(
        `/api/profile-check${childId ? `?childId=${childId}` : ""}`,
        {
          method: "GET",
        }
      );

      if (response.status === 422) {
        const data = await response.json();
        if (data.requiresProfileCompletion) {
          setProfileModalConfig({
            title: "Complete Profile Required",
            message:
              "Please complete your child's therapeutic profile before starting therapy sessions. This helps Dr. Emma provide personalized support.",
            type: "warning",
            icon: <AlertTriangle className="h-6 w-6" />,
            primaryButton: {
              text: "Complete Profile",
              onClick: () => handleProfileCompletion(data.childId),
            },
            secondaryButton: {
              text: "Back to Dashboard",
              onClick: handleGoToDashboard,
            },
          });
          setShowProfileModal(true);
          setIsCheckingProfile(false);
          onClose();
          return;
        }
      }

      if (response.status === 404) {
        const data = await response.json();
        if (data.requiresChildRegistration) {
          setProfileModalConfig({
            title: "Add Child Profile",
            message:
              "Please add a child profile first before accessing therapy sessions.",
            type: "info",
            icon: <UserPlus className="h-6 w-6" />,
            primaryButton: {
              text: "Add Child",
              onClick: handleAddChild,
            },
          });
          setShowProfileModal(true);
          setIsCheckingProfile(false);
          onClose();
          return;
        }
      }

      if (response.status === 401) {
        setProfileModalConfig({
          title: "Authentication Required",
          message: "Please log in to access therapy sessions.",
          type: "error",
          icon: <AlertCircle className="h-6 w-6" />,
          primaryButton: {
            text: "Log In",
            onClick: () => {
              setShowProfileModal(false);
              onClose();
              router.push("/auth/login");
            },
          },
        });
        setShowProfileModal(true);
        setIsCheckingProfile(false);
        onClose();
        return;
      }

      if (response.ok) {
        // Profile check passed, proceed to chat
        setIsCheckingProfile(false);
        onClose();

        if (mode === "text") {
          const chatUrl = childId ? `/chat?childId=${childId}` : "/chat";
          router.push(chatUrl);
        } else if (mode === "voice") {
          const chatUrl = childId
            ? `/chat?childId=${childId}&mode=voice`
            : "/chat?mode=voice";
          router.push(chatUrl);
        }
      } else {
        // Unknown error
        setProfileModalConfig({
          title: "Profile Check Failed",
          message:
            "Unable to verify your child's profile. Please check your connection and try again.",
          type: "error",
          icon: <AlertCircle className="h-6 w-6" />,
          primaryButton: {
            text: "Go to Dashboard",
            onClick: handleGoToDashboard,
          },
        });
        setShowProfileModal(true);
        setIsCheckingProfile(false);
        onClose();
      }
    } catch (error) {
      setProfileModalConfig({
        title: "Connection Error",
        message:
          "Connection error. Please check your internet connection and try again.",
        type: "error",
        icon: <AlertCircle className="h-6 w-6" />,
        primaryButton: {
          text: "Go to Dashboard",
          onClick: handleGoToDashboard,
        },
      });
      setShowProfileModal(true);
      setIsCheckingProfile(false);
      onClose();
    }
  };

  const handleModeSelection = (mode: ChatMode) => {
    checkProfileBeforeChat(mode);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Choose Your Chat Mode"
        type="info"
        hideCloseButton={false}
        maxWidth="max-w-4xl"
      >
        <div className="mb-6">
          <p className="text-purple-600 text-lg text-center mb-6">
            How would you like to talk with Dr. Emma today?
          </p>

          {/* Loading State */}
          {isCheckingProfile && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 mb-6 border border-purple-200">
              <div className="text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mx-auto animate-ping opacity-30"></div>
                </div>
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  Preparing Session...
                </h3>
                <p className="text-purple-600 text-sm">
                  Verifying subscription and profile for a safe therapeutic
                  session
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Text Mode */}
            <button
              onClick={() => handleModeSelection("text")}
              disabled={isCheckingProfile}
              className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-2">
                  Text Chat
                </h3>
                <p className="text-purple-600 text-sm">
                  Type your messages and have a written conversation with Dr.
                  Emma
                </p>
                <div className="mt-3 space-y-1 text-xs text-purple-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Perfect for detailed conversations</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Keep a record of your thoughts</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Voice Mode */}
            <button
              onClick={() => handleModeSelection("voice")}
              disabled={isCheckingProfile}
              className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="h-8 w-8 text-white"
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
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-2">
                  Voice Chat
                </h3>
                <p className="text-purple-600 text-sm">
                  Talk naturally with Dr. Emma using your voice
                </p>
                <div className="mt-3 space-y-1 text-xs text-purple-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Natural conversation flow</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Express emotions through tone</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Safety Notice */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
            <p className="text-purple-700 text-sm text-center">
              💜 Safe & Private: Both modes are completely private and secure.
              Dr. Emma is here to listen and help you with whatever you want to
              share.
            </p>
          </div>
        </div>
      </Modal>

      {/* Profile Check Modal */}
      {showProfileModal && profileModalConfig && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title={profileModalConfig.title}
          type={profileModalConfig.type}
          icon={profileModalConfig.icon}
          primaryButton={profileModalConfig.primaryButton}
          secondaryButton={profileModalConfig.secondaryButton}
          hideCloseButton={false}
        >
          {profileModalConfig.message}
        </Modal>
      )}
    </>
  );
}
