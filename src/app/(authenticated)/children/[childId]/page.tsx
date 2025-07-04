"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  Heart,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Clock,
  TrendingUp,
  Activity,
  BookOpen,
  Target,
  Award,
  BarChart3,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { formatSessionDuration } from "@/lib/utils";
import ChatModeModal from "@/components/common/ChatModeModal";

interface Child {
  id: string;
  name: string;
  age: number;
  gender: string;
  current_concerns: string;
  created_at: string;
  last_session_at?: string;
  sessions_count?: number;
  mood_status?: string;
  has_alerts?: boolean;
  background?: string;
  triggers?: string;
  coping_strategies?: string;
  previous_therapy?: string;
  school_info?: string;
  family_dynamics?: string;
  social_situation?: string;
  reason_for_adding?: string;
  parent_goals?: string;
  emergency_contacts?: string;
  profile_completed?: boolean;
  knowledge_base_documents?: Array<{
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
    content_preview: string;
  }>;
}

interface Session {
  id: string;
  child_id: string;
  created_at: string;
  session_duration: number;
  mood_analysis: {
    happiness: number;
    anxiety: number;
    sadness: number;
    stress: number;
    confidence: number;
    insights?: string;
  };
  topics: string[];
  user_message: string;
  ai_response: string;
  session_summary?: string;
  has_alert: boolean;
  alert_level?: string;
  alert_message?: string;
  children: {
    id: string;
    name: string;
    family_id: string;
  };
}

interface MoodEntry {
  id: string;
  created_at: string;
  mood_score: number;
  notes?: string;
  happiness?: number;
  anxiety?: number;
  sadness?: number;
  stress?: number;
  confidence?: number;
}

interface MoodAnalysis {
  status: string;
  level: string;
  trend: string;
  insights: string;
  recommendations: string[];
  currentAverages: {
    happiness: number;
    anxiety: number;
    sadness: number;
    stress: number;
    confidence: number;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url?: string;
}

export default function ViewChildPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;

  const [child, setChild] = useState<Child | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [moodAnalysis, setMoodAnalysis] = useState<MoodAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showChatModeModal, setShowChatModeModal] = useState(false);

  useEffect(() => {
    if (childId) {
      fetchChildData();
    }
  }, [childId]);

  const fetchChildData = async () => {
    try {
      setIsLoading(true);

      // Fetch child details
      const childResponse = await fetch(`/api/children/${childId}`);
      if (childResponse.ok) {
        const childData = await childResponse.json();
        setChild(childData.child);

        // Update uploaded files from knowledge base documents
        if (childData.child.knowledge_base_documents) {
          const knowledgeBaseFiles: UploadedFile[] =
            childData.child.knowledge_base_documents.map((doc: any) => ({
              id: doc.id,
              name: doc.filename,
              size: doc.file_size,
              type: doc.file_type,
              uploadedAt: new Date(doc.uploaded_at),
            }));
          setUploadedFiles(knowledgeBaseFiles);
        }
      }

      // Fetch sessions
      const sessionsResponse = await fetch(`/api/sessions?childId=${childId}`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);

        // Create mood entries from sessions
        const moodEntriesFromSessions = (sessionsData.sessions || [])
          .filter((session: Session) => session.mood_analysis)
          .map((session: Session) => ({
            id: session.id,
            created_at: session.created_at,
            mood_score: session.mood_analysis.happiness, // Use happiness as primary mood score
            notes:
              session.mood_analysis.insights ||
              `Session: ${session.user_message?.substring(0, 100)}...`,
            happiness: session.mood_analysis.happiness,
            anxiety: session.mood_analysis.anxiety,
            sadness: session.mood_analysis.sadness,
            stress: session.mood_analysis.stress,
            confidence: session.mood_analysis.confidence,
          }));

        setMoodEntries(moodEntriesFromSessions);
      }

      // Fetch mood entries from mood-tracking API as well
      const moodResponse = await fetch(`/api/mood-tracking?childId=${childId}`);
      if (moodResponse.ok) {
        const moodData = await moodResponse.json();

        // Store mood analysis data
        if (moodData.moodAnalysis) {
          setMoodAnalysis(moodData.moodAnalysis);
        }

        // Handle the mood tracking API response structure
        if (moodData.moodData && moodData.moodData.length > 0) {
          const moodEntriesFromAPI = moodData.moodData.map((entry: any) => ({
            id: entry.session_id || `mood-${entry.date}`,
            created_at: `${entry.date}T00:00:00.000Z`, // Convert date to ISO string
            mood_score: entry.happiness, // Use happiness as primary mood score
            notes: entry.notes || "",
            happiness: entry.happiness,
            anxiety: entry.anxiety,
            sadness: entry.sadness,
            stress: entry.stress,
            confidence: entry.confidence,
          }));

          // Combine with session-based mood entries, avoiding duplicates
          setMoodEntries((prev) => {
            const combined = [...prev];
            moodEntriesFromAPI.forEach((apiEntry: MoodEntry) => {
              const exists = combined.find(
                (existing) =>
                  existing.id === apiEntry.id ||
                  existing.created_at.split("T")[0] ===
                    apiEntry.created_at.split("T")[0]
              );
              if (!exists) {
                combined.push(apiEntry);
              }
            });
            return combined.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );
          });
        }
      }
    } catch (error) {
      console.error("Error fetching child data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChild = () => {
    router.push(`/children/add?childId=${childId}`);
  };

  const handleBackToChildren = () => {
    router.push("/children");
  };

  const handleStartSession = () => {
    setShowChatModeModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("childId", childId);

      const response = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.details || "Upload failed"
        );
      }

      const result = await response.json();

      if (result.success) {
        // Clear selected files
        setSelectedFiles([]);

        // Reset file input
        const fileInput = document.getElementById(
          "file-upload"
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }

        // Refresh child data to get updated knowledge base documents
        await fetchChildData();

        console.log("✅ Files uploaded successfully:", result.message);
      } else {
        throw new Error(result.error || result.details || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert(
        `Failed to upload files: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      // Call the DELETE API endpoint to remove from Pinecone
      const response = await fetch(
        `/api/knowledge-base/upload/${fileId}?childId=${childId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      const result = await response.json();
      console.log("✅ File deleted successfully:", result.message);

      // Refresh child data to get updated knowledge base documents
      await fetchChildData();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert(
        `Failed to delete file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getMoodEmoji = (score: number) => {
    if (score >= 8) return "😊";
    if (score >= 6) return "🙂";
    if (score >= 4) return "😐";
    if (score >= 2) return "😔";
    return "😢";
  };

  const getMoodColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    if (score >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const getMoodScore = (entry: MoodEntry) => {
    // Use mood_score if available, otherwise use happiness
    return entry.mood_score || entry.happiness || 5;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Loading child information...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Child not found
          </h3>
          <p className="text-gray-600 mb-4">
            The child you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={handleBackToChildren}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Children
          </button>
        </div>
      </div>
    );
  }

  const recentSessions = sessions.slice(0, 5);
  const recentMoodEntries = moodEntries.slice(0, 7);
  const averageMood =
    moodEntries.length > 0
      ? moodEntries.reduce((sum, entry) => sum + getMoodScore(entry), 0) /
        moodEntries.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToChildren}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {child.name}
              </h1>
              <p className="text-gray-600">
                {child.age} years old • {child.gender}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartSession}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Start Session</span>
            </button>
            <button
              onClick={handleEditChild}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "sessions", label: "Sessions", icon: MessageCircle },
            { id: "mood", label: "Mood Tracking", icon: Heart },
            { id: "progress", label: "Progress", icon: TrendingUp },
            { id: "knowledge", label: "Knowledge Base", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Sessions
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {child.sessions_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Last Session
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {child.last_session_at
                        ? new Date(child.last_session_at).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Avg Mood
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageMood.toFixed(1)}/10
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Member Since
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(child.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Child Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Child Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Current Concerns
                  </h4>
                  <p className="text-gray-900">
                    {child.current_concerns || "No concerns noted"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Profile Created
                  </h4>
                  <p className="text-gray-900">
                    {new Date(child.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {child.background && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Background
                    </h4>
                    <p className="text-gray-900 text-sm">{child.background}</p>
                  </div>
                )}
                {child.triggers && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Triggers
                    </h4>
                    <p className="text-gray-900 text-sm">{child.triggers}</p>
                  </div>
                )}
                {child.coping_strategies && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Coping Strategies
                    </h4>
                    <p className="text-gray-900 text-sm">
                      {child.coping_strategies}
                    </p>
                  </div>
                )}
                {child.parent_goals && (
                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Parent Goals
                    </h4>
                    <p className="text-gray-900 text-sm">
                      {child.parent_goals}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Sessions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Sessions
                </h3>
                {recentSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No sessions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(session.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatSessionDuration(session.session_duration)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Mood: {session.mood_analysis.happiness}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Mood Entries */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Mood
                </h3>
                {recentMoodEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No mood entries yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentMoodEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">
                            {getMoodEmoji(getMoodScore(entry))}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-gray-500">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-sm font-medium ${getMoodColor(
                            getMoodScore(entry)
                          )}`}
                        >
                          {getMoodScore(entry)}/10
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                All Sessions
              </h3>
            </div>
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start your first session to begin tracking progress
                </p>
                <button
                  onClick={handleStartSession}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {new Date(session.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Duration:{" "}
                            {formatSessionDuration(session.session_duration)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Mood:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {session.mood_analysis.happiness}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {session.topics.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">
                            Topics:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {session.topics.map((topic, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.session_summary && (
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">
                            Summary:
                          </h5>
                          <p className="text-xs text-gray-600">
                            {session.session_summary}
                          </p>
                        </div>
                      )}

                      {session.mood_analysis && (
                        <div className="mt-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">
                            Mood Breakdown:
                          </h5>
                          <div className="grid grid-cols-5 gap-1 text-xs">
                            <div className="bg-blue-50 p-1 rounded text-center">
                              <div className="font-medium text-blue-700">
                                Happy
                              </div>
                              <div className="text-blue-900">
                                {session.mood_analysis.happiness}
                              </div>
                            </div>
                            <div className="bg-orange-50 p-1 rounded text-center">
                              <div className="font-medium text-orange-700">
                                Anxiety
                              </div>
                              <div className="text-orange-900">
                                {session.mood_analysis.anxiety}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-1 rounded text-center">
                              <div className="font-medium text-purple-700">
                                Sad
                              </div>
                              <div className="text-purple-900">
                                {session.mood_analysis.sadness}
                              </div>
                            </div>
                            <div className="bg-red-50 p-1 rounded text-center">
                              <div className="font-medium text-red-700">
                                Stress
                              </div>
                              <div className="text-red-900">
                                {session.mood_analysis.stress}
                              </div>
                            </div>
                            <div className="bg-green-50 p-1 rounded text-center">
                              <div className="font-medium text-green-700">
                                Confidence
                              </div>
                              <div className="text-green-900">
                                {session.mood_analysis.confidence}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "mood" && (
          <div className="space-y-6">
            {/* Mood Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mood Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {getMoodEmoji(averageMood)}
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Mood
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {averageMood.toFixed(1)}/10
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Entries
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moodEntries.length}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <p className="text-sm font-medium text-gray-600">Trend</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {moodEntries.length >= 2
                      ? getMoodScore(moodEntries[moodEntries.length - 1]) >
                        getMoodScore(moodEntries[0])
                        ? "↗️ Improving"
                        : getMoodScore(moodEntries[moodEntries.length - 1]) <
                          getMoodScore(moodEntries[0])
                        ? "↘️ Declining"
                        : "→ Stable"
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Mood Analysis Insights */}
              {moodAnalysis && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Current Status
                      </h4>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          moodAnalysis.level === "critical"
                            ? "bg-red-100 text-red-800"
                            : moodAnalysis.level === "high"
                            ? "bg-orange-100 text-orange-800"
                            : moodAnalysis.level === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {moodAnalysis.status}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {moodAnalysis.insights}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {moodAnalysis.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start"
                          >
                            <span className="text-purple-600 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mood Entries */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Mood History
                </h3>
              </div>
              {moodEntries.length === 0 ? (
                <div className="p-8 text-center">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No mood entries yet
                  </h3>
                  <p className="text-gray-600">
                    Mood tracking will begin after your first session
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {moodEntries.map((entry) => (
                    <div key={entry.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">
                            {getMoodEmoji(getMoodScore(entry))}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(entry.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${getMoodColor(
                              getMoodScore(entry)
                            )}`}
                          >
                            {getMoodScore(entry)}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "progress" && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Progress Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Sessions Completed
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (child.sessions_count || 0) * 10,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {child.sessions_count || 0}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Mood Improvement
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(averageMood * 10, 100)
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {averageMood.toFixed(1)}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals and Achievements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Goals & Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Current Goals
                  </h4>
                  <div className="space-y-3">
                    {/* Dynamic session goals based on current count */}
                    {(child.sessions_count || 0) < 5 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Target className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Complete 5 sessions
                          </p>
                          <p className="text-xs text-gray-500">
                            {child.sessions_count || 0}/5 completed
                          </p>
                        </div>
                      </div>
                    )}
                    {(child.sessions_count || 0) >= 5 &&
                      (child.sessions_count || 0) < 10 && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Target className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Complete 10 sessions
                            </p>
                            <p className="text-xs text-gray-500">
                              {child.sessions_count || 0}/10 completed
                            </p>
                          </div>
                        </div>
                      )}
                    {(child.sessions_count || 0) >= 10 &&
                      (child.sessions_count || 0) < 20 && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Target className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Complete 20 sessions
                            </p>
                            <p className="text-xs text-gray-500">
                              {child.sessions_count || 0}/20 completed
                            </p>
                          </div>
                        </div>
                      )}
                    {(child.sessions_count || 0) >= 20 &&
                      (child.sessions_count || 0) < 50 && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Target className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Complete 50 sessions
                            </p>
                            <p className="text-xs text-gray-500">
                              {child.sessions_count || 0}/50 completed
                            </p>
                          </div>
                        </div>
                      )}
                    {(child.sessions_count || 0) >= 50 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Target className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Maintain consistency
                          </p>
                          <p className="text-xs text-gray-500">
                            {child.sessions_count || 0} sessions completed
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mood improvement goal */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Improve mood score
                        </p>
                        <p className="text-xs text-gray-500">
                          Current: {averageMood.toFixed(1)}/10
                        </p>
                      </div>
                    </div>

                    {/* Weekly session goal */}
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Weekly sessions
                        </p>
                        <p className="text-xs text-gray-500">
                          Aim for 1-2 sessions per week
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Achievements
                  </h4>
                  <div className="space-y-3">
                    {/* First Session Achievement */}
                    {(child.sessions_count || 0) >= 1 && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            First Session
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed your first session
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 5 Sessions Achievement */}
                    {(child.sessions_count || 0) >= 5 && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Award className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Consistent Participant
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed 5 sessions
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 10 Sessions Achievement */}
                    {(child.sessions_count || 0) >= 10 && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Award className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Dedicated Learner
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed 10 sessions
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 20 Sessions Achievement */}
                    {(child.sessions_count || 0) >= 20 && (
                      <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                        <Award className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Committed Explorer
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed 20 sessions
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 50 Sessions Achievement */}
                    {(child.sessions_count || 0) >= 50 && (
                      <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                        <Award className="h-5 w-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Master Participant
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed 50 sessions
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 100 Sessions Achievement */}
                    {(child.sessions_count || 0) >= 100 && (
                      <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                        <Award className="h-5 w-5 text-pink-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Century Club
                          </p>
                          <p className="text-xs text-gray-500">
                            Completed 100 sessions
                          </p>
                        </div>
                      </div>
                    )}

                    {/* High Mood Achievement */}
                    {averageMood >= 7 && (
                      <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                        <Award className="h-5 w-5 text-pink-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Positive Mindset
                          </p>
                          <p className="text-xs text-gray-500">
                            Maintained high mood scores
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Recent Activity Achievement */}
                    {child.last_session_at &&
                      new Date().getTime() -
                        new Date(child.last_session_at).getTime() <=
                        7 * 24 * 60 * 60 * 1000 && (
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Award className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Recent Activity
                            </p>
                            <p className="text-xs text-gray-500">
                              Active in the last week
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Recommendations
              </h3>
              <div className="space-y-4">
                {/* API-based recommendations */}
                {moodAnalysis && moodAnalysis.recommendations.length > 0 && (
                  <div className="space-y-3">
                    {moodAnalysis.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg"
                      >
                        <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Professional Recommendation
                          </p>
                          <p className="text-sm text-gray-600">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* General recommendations */}
                {(!child.sessions_count || child.sessions_count < 3) && (
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Start Regular Sessions
                      </p>
                      <p className="text-sm text-gray-600">
                        Consider scheduling regular sessions to build
                        consistency and track progress over time.
                      </p>
                    </div>
                  </div>
                )}
                {averageMood < 6 && (
                  <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                    <Heart className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Focus on Mood Improvement
                      </p>
                      <p className="text-sm text-gray-600">
                        Consider discussing mood management strategies in
                        upcoming sessions.
                      </p>
                    </div>
                  </div>
                )}
                {(!child.last_session_at ||
                  new Date().getTime() -
                    new Date(child.last_session_at).getTime() >
                    7 * 24 * 60 * 60 * 1000) && (
                  <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Schedule Next Session
                      </p>
                      <p className="text-sm text-gray-600">
                        It's been a while since the last session. Consider
                        scheduling a new one to maintain progress.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="space-y-6">
            {/* Knowledge Base Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload Documents
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Upload therapeutic documents, reports, or notes to enhance the
                AI's understanding of {child.name}'s needs.
              </p>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: TXT only (Max 10MB)
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".txt"
                  multiple
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors cursor-pointer inline-block"
                >
                  Choose Files
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Selected Files:
                  </h4>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFileRemove(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      <span>Upload Documents</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Uploaded Documents
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Documents uploaded for {child.name}
                </p>
              </div>

              {/* Uploaded Documents */}
              {uploadedFiles.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No documents uploaded yet
                  </h3>
                  <p className="text-gray-600">
                    Upload documents to help enhance the AI's understanding of{" "}
                    {child.name}'s therapeutic needs.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.type.split("/")[1]?.toUpperCase() ||
                                "Document"}{" "}
                              • {formatFileSize(file.size)} • Uploaded{" "}
                              {file.uploadedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                            title="Delete file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    How Knowledge Base Works
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Uploaded documents help the AI understand {child.name}'s
                      specific needs, therapeutic history, and personalized
                      strategies. This information is used to provide more
                      relevant and tailored responses during chat sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatModeModal
        isOpen={showChatModeModal}
        onClose={() => setShowChatModeModal(false)}
        childId={childId}
      />
    </div>
  );
}
