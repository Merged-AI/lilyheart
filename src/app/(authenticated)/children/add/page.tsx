"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  User,
  ArrowLeft,
  Save,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { apiGet, apiPost, apiPut } from "../../../../lib/api";
import toast from "react-hot-toast";

interface ChildData {
  name: string;
  age: number;
  gender: string;
  background: string;
  currentConcerns: string;
  triggers: string;
  copingStrategies: string;
  previousTherapy: string;
  schoolInfo: string;
  familyDynamics: string;
  socialSituation: string;
  interests: string;
  reasonForAdding: string;
  parentGoals: string;
  emergencyContacts: string;
}

// Loading component for Suspense fallback
function AddChildLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-purple-700">Loading...</p>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function AddChildContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childId = searchParams.get("childId");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const selectRef = useRef<HTMLSelectElement>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasLimitError, setHasLimitError] = useState(false);

  const [childData, setChildData] = useState<ChildData>({
    name: "",
    age: 0,
    gender: "",
    background: "",
    currentConcerns: "",
    triggers: "",
    copingStrategies: "",
    previousTherapy: "",
    schoolInfo: "",
    familyDynamics: "",
    socialSituation: "",
    interests: "",
    reasonForAdding: "",
    parentGoals: "",
    emergencyContacts: "",
  });

  // Fetch existing child data if childId is present
  useEffect(() => {
    const fetchChildData = async () => {
      if (!childId) return;

      setIsLoading(true);
      try {
        const data = await apiGet<{ child: any }>(`children/${childId}`);
        const child = data.child;
        setChildData({
          name: child.name || "",
          age: child.age || 0,
          gender: child.gender || "",
          background: child.background || "",
          currentConcerns: child.current_concerns || "",
          triggers: child.triggers || "",
          copingStrategies: child.coping_strategies || "",
          previousTherapy: child.previous_therapy || "",
          schoolInfo: child.school_info || "",
          familyDynamics: child.family_dynamics || "",
          socialSituation: child.social_situation || "",
          interests: child.interests || "",
          reasonForAdding: child.reason_for_adding || "",
          parentGoals: child.parent_goals || "",
          emergencyContacts: child.emergency_contacts || "",
        });
      } catch (error) {
        console.error("Error fetching child data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildData();
  }, [childId]);

  const handleInputChange = (
    field: keyof ChildData,
    value: string | number
  ) => {
    setChildData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Show age error immediately if age becomes invalid
    if (field === "age") {
      const ageValue = typeof value === "string" ? parseInt(value) : value;
      if (ageValue < 3 || ageValue > 18) {
        setErrors((prev) => ({
          ...prev,
          age: "Age must be between 3 and 18 years",
        }));
      }
    }

    // Show character limit error for text fields
    if (typeof value === "string" && value.length > 150) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Maximum 150 characters allowed",
      }));
    }
  };

  const validateAge = () => {
    if (childData.age < 3 || childData.age > 18) {
      setErrors((prev) => ({
        ...prev,
        age: "Age must be between 3 and 18 years",
      }));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setHasLimitError(false);

    try {
      if (childId) {
        // Update existing child
        const result = await apiPut<{ child: any }>(
          `children/${childId}`,
          childData
        );
        toast.success(
          `${childData.name}'s information has been updated successfully!`
        );
      } else {
        // Add new child
        const result = await apiPost<{ child: any }>("children", childData);
        toast.success(`${childData.name} has been added successfully!`);
      }

      // Notify other components that children data has changed
      window.dispatchEvent(new CustomEvent("refreshChildren"));

      router.push("/children");
    } catch (error: any) {
      // Check if it's a limit error (400 status)
      if (error.response?.status === 400) {
        setHasLimitError(true);
      } else {
        const errorMessage =
          error.message || "Failed to save child. Please try again.";
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate age before proceeding to next step
    if (currentStep === 1 && (childData.age < 3 || childData.age > 18)) {
      validateAge();
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-purple-900 mb-6"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Child's Name *
                </label>
                <input
                  type="text"
                  value={childData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your child's name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  min="3"
                  max="18"
                  value={childData.age || ""}
                  onChange={(e) =>
                    handleInputChange("age", parseInt(e.target.value) || 0)
                  }
                  className="w-full p-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Age"
                  required
                />
                {errors.age && (
                  <p className="text-red-600 text-sm mt-1">{errors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Gender
                </label>
                <div className="relative">
                  <select
                    value={childData.gender}
                    onChange={(e) => {
                      handleInputChange("gender", e.target.value);
                      // Close dropdown immediately after selection
                      setIsSelectOpen(false);
                    }}
                    onMouseDown={() => setIsSelectOpen(!isSelectOpen)}
                    onBlur={() => {
                      // Use a longer timeout to allow for option selection
                      setTimeout(() => setIsSelectOpen(false), 200);
                    }}
                    className="w-full p-3 pr-10 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent appearance-none bg-white"
                    ref={selectRef}
                  >
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <ChevronDown
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none transition-transform duration-200 ${
                      isSelectOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Why are you adding your child to Lily Heart AI? *
              </label>
              <textarea
                value={childData.reasonForAdding}
                onChange={(e) =>
                  handleInputChange("reasonForAdding", e.target.value)
                }
                rows={4}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.reasonForAdding ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Help us understand what brought you here - anxiety, social issues, behavioral concerns, school stress, etc."
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.reasonForAdding && (
                  <p className="text-red-600 text-sm">{errors.reasonForAdding}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.reasonForAdding.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.reasonForAdding.length}/150
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-purple-900 mb-6"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Current Concerns & Background
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Current Mental Health Concerns *
              </label>
              <textarea
                value={childData.currentConcerns}
                onChange={(e) =>
                  handleInputChange("currentConcerns", e.target.value)
                }
                rows={4}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.currentConcerns ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Describe any anxiety, depression, mood swings, behavioral issues, or other concerns you've noticed"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.currentConcerns && (
                  <p className="text-red-600 text-sm">{errors.currentConcerns}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.currentConcerns.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.currentConcerns.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Known Triggers
              </label>
              <textarea
                value={childData.triggers}
                onChange={(e) => handleInputChange("triggers", e.target.value)}
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.triggers ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="What situations, events, or topics tend to upset or stress your child?"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.triggers && (
                  <p className="text-red-600 text-sm">{errors.triggers}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.triggers.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.triggers.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Background & Experiences
              </label>
              <textarea
                value={childData.background}
                onChange={(e) =>
                  handleInputChange("background", e.target.value)
                }
                rows={4}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.background ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Any significant events, trauma, changes, or experiences that might be relevant to your child's mental health"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.background && (
                  <p className="text-red-600 text-sm">{errors.background}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.background.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.background.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Previous Therapy or Treatment
              </label>
              <textarea
                value={childData.previousTherapy}
                onChange={(e) =>
                  handleInputChange("previousTherapy", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.previousTherapy ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Has your child seen a therapist, counselor, or taken medication? What worked or didn't work?"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.previousTherapy && (
                  <p className="text-red-600 text-sm">{errors.previousTherapy}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.previousTherapy.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.previousTherapy.length}/150
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-purple-900 mb-6"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Social & Family Context
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                School Situation
              </label>
              <textarea
                value={childData.schoolInfo}
                onChange={(e) =>
                  handleInputChange("schoolInfo", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.schoolInfo ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="How is school going? Any issues with grades, teachers, bullying, or academic pressure?"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.schoolInfo && (
                  <p className="text-red-600 text-sm">{errors.schoolInfo}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.schoolInfo.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.schoolInfo.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Social Relationships
              </label>
              <textarea
                value={childData.socialSituation}
                onChange={(e) =>
                  handleInputChange("socialSituation", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.socialSituation ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="How are your child's friendships? Any social anxiety, conflicts, or isolation issues?"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.socialSituation && (
                  <p className="text-red-600 text-sm">{errors.socialSituation}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.socialSituation.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.socialSituation.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Family Dynamics
              </label>
              <textarea
                value={childData.familyDynamics}
                onChange={(e) =>
                  handleInputChange("familyDynamics", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.familyDynamics ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Family structure, relationships, any recent changes like divorce, moves, new siblings, etc."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.familyDynamics && (
                  <p className="text-red-600 text-sm">{errors.familyDynamics}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.familyDynamics.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.familyDynamics.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Current Coping Strategies
              </label>
              <textarea
                value={childData.copingStrategies}
                onChange={(e) =>
                  handleInputChange("copingStrategies", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.copingStrategies ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="What does your child do now when they're upset? What helps them feel better?"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.copingStrategies && (
                  <p className="text-red-600 text-sm">{errors.copingStrategies}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.copingStrategies.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.copingStrategies.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Interests & Hobbies
              </label>
              <textarea
                value={childData.interests}
                onChange={(e) => handleInputChange("interests", e.target.value)}
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.interests ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="What does your child enjoy doing? Hobbies, activities, sports, books, games, pets, etc."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.interests && (
                  <p className="text-red-600 text-sm">{errors.interests}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.interests.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.interests.length}/150
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2
              className="text-2xl font-bold text-purple-900 mb-6"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Goals & Emergency Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Your Goals for Therapy *
              </label>
              <textarea
                value={childData.parentGoals}
                onChange={(e) =>
                  handleInputChange("parentGoals", e.target.value)
                }
                rows={4}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.parentGoals ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="What do you hope Dr. Emma can help your child with? What would success look like?"
                required
              />
              <div className="flex justify-between items-center mt-1">
                {errors.parentGoals && (
                  <p className="text-red-600 text-sm">{errors.parentGoals}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.parentGoals.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.parentGoals.length}/150
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Emergency Contacts
              </label>
              <textarea
                value={childData.emergencyContacts}
                onChange={(e) =>
                  handleInputChange("emergencyContacts", e.target.value)
                }
                rows={3}
                maxLength={150}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
                  errors.emergencyContacts ? "border-red-300" : "border-purple-200"
                }`}
                placeholder="Who should be contacted in an emergency? Include names, relationships, and phone numbers."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.emergencyContacts && (
                  <p className="text-red-600 text-sm">{errors.emergencyContacts}</p>
                )}
                <p className={`text-sm ml-auto ${
                  childData.emergencyContacts.length > 140 ? "text-red-500" : "text-gray-500"
                }`}>
                  {childData.emergencyContacts.length}/150
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Brain className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-2">
                    How Dr. Emma Will Use This Information
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Dr. Emma AI will use this background to provide
                    personalized, context-aware therapy. She'll understand your
                    child's unique situation, avoid known triggers, and focus on
                    areas you've identified as important. All information is
                    kept completely private and secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    // Check if there are any character limit errors
    const hasCharacterLimitErrors = Object.values(errors).some(error => 
      error === "Maximum 150 characters allowed"
    );
    
    if (hasCharacterLimitErrors) {
      return false;
    }

    switch (currentStep) {
      case 1:
        // Check age validation without calling validateAge to avoid infinite re-renders
        const isAgeValid = childData.age >= 3 && childData.age <= 18;
        return (
          childData.name.trim() &&
          isAgeValid &&
          childData.reasonForAdding.trim()
        );
      case 2:
        return childData.currentConcerns.trim();
      case 3:
        return true; // All fields optional
      case 4:
        return childData.parentGoals.trim();
      default:
        return false;
    }
  };

  // Show loader while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <h2
              className="text-xl font-bold text-purple-900"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Loading Child Information
            </h2>
            <p className="text-purple-600 text-center">
              Please wait while we load your child's information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/children"
                className="text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-xl font-bold text-purple-900"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    {childId
                      ? "Edit Child Information"
                      : "Add Child to Lily Heart AI"}
                  </h1>
                  <p className="text-sm text-purple-600">
                    Step {currentStep} of {totalSteps}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg p-1">
          <div className="flex items-center">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div
                  className={`w-full h-2 rounded-full ${
                    i + 1 <= currentStep ? "bg-purple-500" : "bg-gray-200"
                  }`}
                />
                {i < totalSteps - 1 && <div className="w-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStepContent()}

          {/* Child Limit Error */}
          {hasLimitError && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-red-800 mb-1">
                    Children Limit Reached
                  </h3>
                  <p className="text-red-700 text-sm">
                    You have reached the maximum limit of 3 children per family.
                    Please contact support if you need to increase this limit.
                  </p>
                  <button
                    onClick={() => router.push("/children")}
                    className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium underline"
                  >
                    Return to Children List
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-purple-300 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-4">
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting || hasLimitError}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? childId
                        ? "Updating Child..."
                        : "Adding Child..."
                      : childId
                      ? "Update Child & Continue"
                      : "Add Child & Start Therapy"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddChildPage() {
  return (
    <Suspense fallback={<AddChildLoading />}>
      <AddChildContent />
    </Suspense>
  );
}
