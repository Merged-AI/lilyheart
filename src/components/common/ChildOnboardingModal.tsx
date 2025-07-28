"use client";

import { useState } from "react";
import {
  Heart,
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Modal from "./Modal";

interface ChildOnboardingModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onClose: () => void;
}

export default function ChildOnboardingModal({
  isOpen,
  onContinue,
  onClose,
}: ChildOnboardingModalProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleContinue = () => {
    if (hasAgreed) {
      onContinue();
    }
  };

  const openTermsOfUse = () => {
    // Open terms of use in a new tab
    window.open("/terms-of-use", "_blank");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      type="info"
      hideCloseButton={true}
      maxWidth="max-w-2xl"
    >
      <div className="max-w-2xl mx-auto p-3">
        {/* Header */}
        <div className="text-center mb-4">
          <h1
            className="text-xl sm:text-2xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Welcome to Lily Heart
          </h1>
          <p
            className="text-sm sm:text-base text-gray-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Your AI family communication companion
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-3 mb-4">
          {/* Description */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p
              className="text-gray-700 text-sm leading-relaxed"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Lily Heart is an AI-based mental wellness companion designed to
              offer support and helpful insights. It is{" "}
              <strong>not a licensed therapist</strong> and{" "}
              <strong>not a substitute for professional care</strong>.
            </p>
          </div>

          {/* Crisis Support */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3
                  className="font-semibold text-orange-800 mb-1 text-sm"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  If you are in crisis or need mental health support:
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-orange-700">Canada:</span>
                    <button
                      onClick={() => window.open("tel:1-833-456-4566")}
                      className="text-orange-600 hover:text-orange-700 underline hover:no-underline transition-colors"
                    >
                      Talk Suicide Canada – 1-833-456-4566
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-orange-700">U.S.:</span>
                    <button
                      onClick={() => window.open("tel:988")}
                      className="text-orange-600 hover:text-orange-700 underline hover:no-underline transition-colors"
                    >
                      Suicide & Crisis Lifeline – Call or text 988
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="mb-4">
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <div className="text-xs text-gray-700">
              <p style={{ fontFamily: "var(--font-inter)" }}>
                By continuing, you agree to our{" "}
                <button
                  type="button"
                  onClick={openTermsOfUse}
                  className="text-purple-600 hover:text-purple-700 underline inline-flex items-center space-x-1"
                >
                  <span>Terms of Use</span>
                  <ExternalLink className="h-3 w-3" />
                </button>{" "}
                and acknowledge that Lily Heart is for informational purposes
                only.
              </p>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleContinue}
            disabled={!hasAgreed}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
              hasAgreed
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transform hover:-translate-y-0.5 hover:shadow-lg"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Continue to Chat</span>
          </button>

          <button
            onClick={openTermsOfUse}
            className="flex-1 px-4 py-2.5 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200 flex items-center justify-center space-x-2 text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Terms of Use</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
