"use client";

import { useRouter } from "next/navigation";
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

  const handleModeSelection = (mode: ChatMode) => {
    if (mode === "text") {
      // Navigate to text chat
      const chatUrl = childId ? `/chat?childId=${childId}` : "/chat";
      router.push(chatUrl);
    } else if (mode === "voice") {
      const chatUrl = childId
        ? `/chat?childId=${childId}&mode=voice`
        : "/chat?mode=voice";
      router.push(chatUrl);
    }

    onClose();
  };

  return (
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

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Text Mode */}
          <button
            onClick={() => handleModeSelection("text")}
            className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group w-full"
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
                Type your messages and have a written conversation with Dr. Emma
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
            className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group w-full"
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
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-purple-200 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <svg
              className="h-4 w-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-purple-700 font-medium">Safe & Private</span>
          </div>
          <p className="text-purple-600 text-sm">
            Both modes are completely private and secure. Dr. Emma is here to
            listen and help you with whatever you want to share.
          </p>
        </div>
      </div>
    </Modal>
  );
}
