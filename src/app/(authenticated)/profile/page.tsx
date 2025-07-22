"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
import SubscriptionManagement from "@/components/payment/subscription-management";
import {
  User,
  Users,
  Mail,
  Calendar,
  Settings,
  Save,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const { family, checkAuthentication } = useAuth();
  const [formData, setFormData] = useState({
    parentName: "",
    familyName: "",
  });
  const [originalData, setOriginalData] = useState({
    parentName: "",
    familyName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Initialize form data from auth context
  useEffect(() => {
    if (family) {
      const initialData = {
        parentName: family.parent_name || "",
        familyName: family.family_name || "",
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [family]);

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.parentName !== originalData.parentName ||
      formData.familyName !== originalData.familyName
    );
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.parentName.trim()) {
      newErrors.parentName = "Name is required";
    }

    if (!formData.familyName.trim()) {
      newErrors.familyName = "Family name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_name: formData.parentName.trim(),
          family_name: formData.familyName.trim(),
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        // Update original data to reflect the new state
        setOriginalData({
          parentName: formData.parentName.trim(),
          familyName: formData.familyName.trim(),
        });
        // Refresh auth context to get updated data
        await checkAuthentication();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Loading your profile
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch your information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Information Section */}
          <div className="xl:col-span-2 space-y-8">
            {/* Account Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-8 py-6">
                <div className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Account Information
                  </h2>
                </div>
                <p className="text-gray-600 mt-2">
                  Update your personal and family details
                </p>
              </div>

              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Personal Details */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center space-x-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <span>Personal Details</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Your Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.parentName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                parentName: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                              errors.parentName
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 bg-white hover:border-gray-400"
                            }`}
                            placeholder="Enter your full name"
                          />
                          <User className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                        {errors.parentName && (
                          <p className="text-red-600 text-sm flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>{errors.parentName}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Family Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.familyName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                familyName: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-3 pl-11 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                              errors.familyName
                                ? "border-red-300 bg-red-50"
                                : "border-gray-300 bg-white hover:border-gray-400"
                            }`}
                            placeholder="The Smith Family"
                          />
                          <Users className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                        {errors.familyName && (
                          <p className="text-red-600 text-sm flex items-center space-x-1">
                            <span>⚠️</span>
                            <span>{errors.familyName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Account Summary */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span>Account Summary</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">
                          Email Address
                        </p>
                        <p className="font-medium text-gray-900">
                          {family.parent_email}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">
                          Member Since
                        </p>
                        <p className="font-medium text-gray-900 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {family.created_at
                              ? new Date(family.created_at).toLocaleDateString(
                                  "en-US",
                                  { year: "numeric", month: "long" }
                                )
                              : "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !hasChanges()}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                        hasChanges() && !isLoading
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Subscription Management Section */}
          <div className="xl:col-span-1">
            <div className="sticky top-8">
              <SubscriptionManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
