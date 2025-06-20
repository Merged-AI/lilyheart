"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
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
  icon?: ReactNode;
  type?: "info" | "warning" | "error" | "success";
  hideCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  primaryButton,
  secondaryButton,
  icon,
  type = "info",
  hideCloseButton,
}: ModalProps) {
  if (!isOpen) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case "warning":
        return "border-yellow-500 bg-yellow-50";
      case "error":
        return "border-red-500 bg-red-50";
      case "success":
        return "border-green-500 bg-green-50";
      default:
        return "border-purple-500 bg-purple-50";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "success":
        return "text-green-600";
      default:
        return "text-purple-600";
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className={`bg-white rounded-2xl p-8 max-w-md w-full border-4 ${getTypeStyles()}`}
        style={{ position: "relative", zIndex: 10000 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            {icon && (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconColor()}`}
              >
                {icon}
              </div>
            )}
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="text-gray-700 mb-6">{children}</div>

        <div className="flex justify-end space-x-3">
          {secondaryButton && (
            <button
              onClick={secondaryButton.onClick}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                secondaryButton.className ||
                "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {secondaryButton.text}
            </button>
          )}
          {primaryButton && (
            <button
              onClick={primaryButton.onClick}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                primaryButton.className ||
                "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {primaryButton.text}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
