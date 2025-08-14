"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";
// Removed SubscriptionManagement - now handled in separate /account page
import { apiPost, apiGet } from "@/lib/api";
import {
  User,
  Users,
  Mail,
  Calendar,
  Settings,
  Save,
  RefreshCw,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  background: string;
  current_concerns: string;
  triggers: string;
  coping_strategies: string;
  previous_therapy: string;
  school_info: string;
  family_dynamics: string;
  social_situation: string;
  interests: string;
  reason_for_adding: string;
  parent_goals: string;
  emergency_contacts: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { family, checkAuthentication } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
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

  // Fetch children data
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await apiGet<{ children: Child[] }>("children");
        setChildren(data.children || []);
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setChildrenLoading(false);
      }
    };

    fetchChildren();
  }, []);

  // Calculate profile completeness for a child
  const calculateCompleteness = (child: Child) => {
    const fields = [
      "background",
      "current_concerns",
      "triggers",
      "coping_strategies",
      "previous_therapy",
      "school_info",
      "family_dynamics",
      "social_situation",
      "interests",
      "reason_for_adding",
      "parent_goals",
      "emergency_contacts",
    ];

    const filledFields = fields.filter(
      (field) =>
        child[field as keyof Child] &&
        String(child[field as keyof Child]).trim().length > 0
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  };

  // Get improvement suggestions based on missing fields
  const getImprovementSuggestions = (child: Child) => {
    const suggestions = [];

    if (!child.interests?.trim()) {
      suggestions.push("Add interests to help AI engage with topics they love");
    }
    if (!child.coping_strategies?.trim()) {
      suggestions.push("Share what calms them for personalized support");
    }
    if (!child.triggers?.trim()) {
      suggestions.push("Note triggers so AI can be more sensitive");
    }
    if (!child.family_dynamics?.trim()) {
      suggestions.push("Update family changes for better context");
    }

    return suggestions.slice(0, 2); // Show top 2 suggestions
  };

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
      const result = await apiPost<{ message: string }>("profile/update", {
        parent_name: formData.parentName.trim(),
        family_name: formData.familyName.trim(),
      });

      toast.success(result.message || "Profile updated successfully!");
      // Update original data to reflect the new state
      setOriginalData({
        parentName: formData.parentName.trim(),
        familyName: formData.familyName.trim(),
      });
      // Refresh auth context to get updated data
      await checkAuthentication();
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Information Section */}
          <div className="space-y-8">
            {/* Children Profile Progress */}
            {childrenLoading && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Children Profile Progress
                    </h2>
                  </div>
                  <p className="text-purple-700 mt-2">
                    Complete profiles lead to better therapeutic outcomes
                  </p>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                    <span className="text-gray-600 text-sm">
                      Loading children profiles...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!childrenLoading && children.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-6 w-6 text-purple-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Children Profile Progress
                    </h2>
                  </div>
                  <p className="text-purple-700 mt-2">
                    Complete profiles lead to better therapeutic outcomes
                  </p>
                </div>
                <div className="p-8">
                  <div
                    className={`space-y-6 ${
                      children.length >= 2
                        ? "lg:space-y-0 lg:grid lg:gap-6 lg:grid-cols-2 lg:auto-rows-fr"
                        : ""
                    }`}
                  >
                    {children.map((child) => {
                      const completeness = calculateCompleteness(child);
                      const suggestions = getImprovementSuggestions(child);
                      const isComplete = completeness >= 80;

                      return (
                        <div
                          key={child.id}
                          className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {child.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {child.age} years old • {child.gender}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {isComplete ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                              )}
                              <span
                                className={`text-sm font-medium ${
                                  isComplete
                                    ? "text-green-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {completeness}% complete
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  isComplete
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : "bg-gradient-to-r from-purple-500 to-blue-500"
                                }`}
                                style={{ width: `${completeness}%` }}
                              />
                            </div>
                          </div>

                          {/* AI Benefits */}
                          {completeness >= 60 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start space-x-2">
                                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                                <div className="text-sm text-green-800">
                                  <span className="font-medium">
                                    AI is learning well!
                                  </span>
                                  {child.interests && (
                                    <span className="block mt-1">
                                      ✓ Will mention{" "}
                                      {child.interests
                                        .split(",")[0]
                                        .trim()
                                        .toLowerCase()}{" "}
                                      to engage {child.name}
                                    </span>
                                  )}
                                  {child.coping_strategies && (
                                    <span className="block">
                                      ✓ Knows {child.name}'s calming techniques
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Improvement Suggestions */}
                          {suggestions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">
                                Quick improvements for better sessions:
                              </p>
                              {suggestions.map((suggestion, index) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2 text-sm text-gray-600"
                                >
                                  <ArrowRight className="h-3 w-3 text-purple-500" />
                                  <span>{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                              onClick={() =>
                                router.push(`/children/add?childId=${child.id}`)
                              }
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1 hover:underline"
                            >
                              <span>Update {child.name}'s profile</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-white border-b border-gray-200 px-8 py-6">
                <div className="flex items-center space-x-3">
                  <Settings className="h-6 w-6 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Profile Information
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">
                          Email Address
                        </p>
                        <p className="font-medium text-gray-900 text-sm">
                          {family.parent_email}
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">
                          Member Since
                        </p>
                        <p className="font-medium text-gray-900 flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {family.created_at
                              ? new Date(family.created_at).toLocaleDateString(
                                  "en-US",
                                  { year: "numeric", month: "long" }
                                )
                              : "N/A"}
                          </span>
                        </p>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">
                          Account Type
                        </p>
                        <p className="font-medium text-gray-900 text-sm">
                          Family Plan
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
        </div>
      </div>
    </div>
  );
}
