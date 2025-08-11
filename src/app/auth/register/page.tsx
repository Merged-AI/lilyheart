"use client";

import { useState } from "react";
import {
  Brain,
  ArrowRight,
  Check,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import PaymentForm from "@/components/payment/payment-form";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    password: "",
    confirmPassword: "",
    familyName: "",
    children: [{ name: "", age: "", concerns: "" }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const addChild = () => {
    if (formData.children.length < 4) {
      setFormData({
        ...formData,
        children: [...formData.children, { name: "", age: "", concerns: "" }],
      });
    }
  };

  const removeChild = (index: number) => {
    const newChildren = formData.children.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      children:
        newChildren.length > 0
          ? newChildren
          : [{ name: "", age: "", concerns: "" }],
    });
  };

  const updateChild = (index: number, field: string, value: string) => {
    const newChildren = [...formData.children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setFormData({ ...formData, children: newChildren });
  };

  const validateStep = (currentStep: number) => {
    const newErrors: any = {};

    if (currentStep === 1) {
      // Account validation
      if (!formData.parentName.trim())
        newErrors.parentName = "Name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      if (!formData.email.includes("@"))
        newErrors.email = "Valid email is required";
      if (!formData.password) newErrors.password = "Password is required";
      if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";

      // Family validation
      if (!formData.familyName.trim())
        newErrors.familyName = "Family name is required";
      formData.children.forEach((child, index) => {
        if (!child.name.trim())
          newErrors[`child_${index}_name`] = "Child name is required";
        if (!child.age.trim())
          newErrors[`child_${index}_age`] = "Age is required";
        if (
          isNaN(Number(child.age)) ||
          Number(child.age) < 3 ||
          Number(child.age) > 18
        ) {
          newErrors[`child_${index}_age`] = "Age must be between 3-18 years";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep(step)) {
      // Check if user already exists before proceeding to payment
      try {
        setIsLoading(true);
        const data = await apiPost("/auth/check-user", {
          email: formData.email,
        });

        if (data.exists) {
          // User already exists, show error
          setErrors({
            submit:
              "An account with this email already exists. Please log in instead.",
          });
          return;
        }

        // User doesn't exist, proceed to payment
        setStep(step + 1);
      } catch (error) {
        setStep(step + 1);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePaymentSuccess = (result: any) => {
    // Payment setup successful, show success page then redirect to PIN setup
    setStep(3);
    setTimeout(() => {
      router.push("/pin-setup");
    }, 3000); // 3 second delay to show success message
  };

  const handlePaymentError = (error: string) => {
    setErrors({ submit: error });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Lily Heart AI
                </h1>
                <p className="text-sm text-gray-600">
                  Family Communication Coach
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 md:space-x-8">
            <div
              className={`flex items-center space-x-2 ${
                step >= 1 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-purple-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="font-medium text-sm md:text-base">
                Account & Family
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div
              className={`flex items-center space-x-2 ${
                step >= 2 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-purple-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="font-medium text-sm md:text-base">
                Payment & Trial
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div
              className={`flex items-center space-x-2 ${
                step >= 3 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 3 ? "bg-purple-600 text-white" : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="font-medium text-sm md:text-base">Success</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div
              className={`flex items-center space-x-2 ${
                step >= 4 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 4 ? "bg-purple-600 text-white" : "bg-gray-200"
                }`}
              >
                4
              </div>
              <span className="font-medium text-sm md:text-base">
                PIN Setup
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Create Your Account & Family
                </h2>

                <div className="space-y-6">
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
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Create a secure password"
                        />
                        {errors.password && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Family Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Family Information
                    </h3>
                    <div className="mb-4">
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

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Children Information
                        </h4>
                        {formData.children.length < 3 && (
                          <button
                            onClick={addChild}
                            className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                          >
                            + Add Another Child
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {formData.children.map((child, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-gray-900">
                                Child {index + 1}
                              </h5>
                              {formData.children.length > 1 && (
                                <button
                                  onClick={() => removeChild(index)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={child.name}
                                  onChange={(e) =>
                                    updateChild(index, "name", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Child's name"
                                />
                                {errors[`child_${index}_name`] && (
                                  <p className="text-red-600 text-xs mt-1">
                                    {errors[`child_${index}_name`]}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Age
                                </label>
                                <input
                                  type="number"
                                  min="3"
                                  max="18"
                                  value={child.age}
                                  onChange={(e) =>
                                    updateChild(index, "age", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Age"
                                />
                                {errors[`child_${index}_age`] && (
                                  <p className="text-red-600 text-xs mt-1">
                                    {errors[`child_${index}_age`]}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Communication Focus (Optional)
                              </label>
                              <textarea
                                value={child.concerns}
                                onChange={(e) =>
                                  updateChild(index, "concerns", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                rows={2}
                                placeholder="What would you like to work on? (stress, friendships, school, etc.)"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-medium mb-1">🚀 Almost there!</p>
                    <p>
                      Next, we'll set up your payment method to start your 7-day
                      free trial.
                    </p>
                  </div>

                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm text-center">
                        {errors.submit}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Payment</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Start Your Free Trial
                </h2>

                {/* Use key prop to ensure PaymentForm is properly unmounted/remounted */}
                <PaymentForm
                  key={`payment-form-${step}`}
                  familyData={formData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    ← Back to Account Setup
                  </button>
                </div>

                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm text-center">
                      {errors.submit}
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Lily Heart AI!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your account has been created and your 7-day free trial has
                  started. Next, let's set up your parent PIN for secure
                  dashboard access.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-green-800">
                    <strong>🎉 Trial Active:</strong>
                    <br />
                    Your free trial runs for 7 days. You can cancel anytime
                    before it ends.
                  </p>
                </div>

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">
                  Setting up your account...
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">
                  Family Communication Coach
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold">$39</span>
                  <span className="text-purple-200">/month</span>
                </div>
                <p className="text-purple-100 text-sm mt-2">
                  Everything your family needs
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Unlimited AI Conversations
                    </p>
                    <p className="text-sm text-gray-600">
                      Up to 4 family members
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Parent Dashboard
                    </p>
                    <p className="text-sm text-gray-600">
                      Conversation insights & patterns
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Appointment Preparation
                    </p>
                    <p className="text-sm text-gray-600">
                      Organize thoughts for professionals
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      24/7 Emotional Support
                    </p>
                    <p className="text-sm text-gray-600">
                      Always available companion
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Family Progress Tracking
                    </p>
                    <p className="text-sm text-gray-600">
                      Communication growth over time
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>7-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-2">
                    <Users className="h-4 w-4" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
