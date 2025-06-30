"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Profile Settings
                </h2>
                <p className="text-gray-600">
                  Update your personal and family information
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parentName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                      {errors.parentName && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.parentName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Name
                      </label>
                      <input
                        type="text"
                        value={formData.familyName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familyName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="The Smith Family"
                      />
                      {errors.familyName && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.familyName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !hasChanges()}
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Profile</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
