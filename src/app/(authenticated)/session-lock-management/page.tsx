"use client";

import { useState } from "react";
import { Eye, EyeOff, Shield, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SessionLockManagementPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPin !== confirmNewPin) {
      toast.error("PINs do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    if (newPin.length !== 4) {
      toast.error("PIN must be exactly 4 digits.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/pin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "PIN updated successfully!");
        setCurrentPin("");
        setNewPin("");
        setConfirmNewPin("");
      } else {
        toast.error(
          data.error ||
            data.message ||
            "Failed to update PIN. Please try again."
        );
      }
    } catch (error) {
      toast.error("Network error. Please check your connection and try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Session Lock Management
        </h1>
        <p className="text-gray-600">
          Manage your parent PIN and to control access to your child's therapy
          insights.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* PIN Management */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Parent PIN
              </h2>
              <p className="text-gray-600 text-sm">
                Change your 4-digit access code
              </p>
            </div>
          </div>

          <form onSubmit={handlePinChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current PIN
              </label>
              <div className="relative">
                <input
                  type={showCurrentPin ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                  placeholder="Enter current PIN"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPin ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New PIN
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? "text" : "password"}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                  placeholder="Enter new PIN"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPin ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New PIN
              </label>
              <div className="relative">
                <input
                  type={showConfirmPin ? "text" : "password"}
                  value={confirmNewPin}
                  onChange={(e) =>
                    setConfirmNewPin(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                  placeholder="Confirm new PIN"
                  maxLength={4}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPin ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                currentPin.length !== 4 ||
                newPin.length !== 4 ||
                confirmNewPin.length !== 4
              }
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Updating..." : "Update PIN"}
            </button>
          </form>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">
              Security Reminders
            </h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Keep your PIN secure and don't share it with your child</li>
              <li>• Change your PIN regularly for better security</li>
              <li>• Session lock ensures your child's privacy is protected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
