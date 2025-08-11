"use client";

import { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";

export default function PinSetupPage() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      setIsLoading(false);
      return;
    }

    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      setIsLoading(false);
      return;
    }

    try {
      // Save PIN to database via Node.js backend
      const response = await apiCall("/auth/pin", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError("Failed to save PIN. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set Parent PIN
          </h1>
          <p className="text-gray-600 text-sm">
            Create a 4-digit PIN to access the dashboard after your child's
            therapy sessions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Input */}
          <div>
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Create PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPin ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label
              htmlFor="confirmPin"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm PIN
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? "text" : "password"}
                id="confirmPin"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
                placeholder="Confirm 4-digit PIN"
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "Save PIN"}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-xs font-medium mb-1">
            Security Notice
          </p>
          <p className="text-blue-700 text-xs">
            This PIN will be used to access detailed insights after your child's
            therapy sessions. Keep it secure and don't share it with your child.
          </p>
        </div>
      </div>
    </div>
  );
}
