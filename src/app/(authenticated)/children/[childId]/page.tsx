"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
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
import { apiGet, apiDelete, apiUpload } from "../../../../lib/api";

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
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showChatModeModal, setShowChatModeModal] = useState(false);
  // Track what data has been loaded to avoid unnecessary refetches
  const [loadedTabs, setLoadedTabs] = useState<string[]>(["overview"]);

  useEffect(() => {
    if (childId) {
      fetchChildData();
    }
  }, [childId]);

  // Handle tab changes with lazy loading
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    // Only load data if we haven't loaded it before
    if (!loadedTabs.includes(tabId)) {
      setLoadedTabs((prev) => [...prev, tabId]);
    }
  };

  const fetchChildData = async () => {
    try {
      setIsLoading(true);

      // Fetch child details
      const childData = await apiGet<{ child: Child }>(`children/${childId}`);
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

      // Only fetch recent sessions for overview (limit to 5)
      const recentSessionsData = await apiGet<{ sessions: Session[] }>(
        `sessions?childId=${childId}&limit=5`
      );
      setRecentSessions(recentSessionsData.sessions || []);

      // Create mood entries from recent sessions only for overview
      const recentMoodEntries = (recentSessionsData.sessions || [])
        .filter((session: Session) => session.mood_analysis)
        .map((session: Session) => ({
          id: session.id,
          created_at: session.created_at,
          mood_score: session.mood_analysis.happiness,
          notes: session.mood_analysis.insights,
          happiness: session.mood_analysis.happiness,
          anxiety: session.mood_analysis.anxiety,
          sadness: session.mood_analysis.sadness,
          stress: session.mood_analysis.stress,
          confidence: session.mood_analysis.confidence,
        }));

      setMoodEntries(recentMoodEntries);
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

      // Use apiUpload for FormData uploads
      const result = await apiUpload("knowledge-base/upload", formData);

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
      const result = await apiDelete(
        `knowledge-base/upload/${fileId}?childId=${childId}`
      );

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
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button
              onClick={handleBackToChildren}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                {child.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {child.age} years old • {child.gender}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-4">
            <button
              onClick={handleStartSession}
              className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Start Session</span>
              <span className="xs:hidden sm:hidden">Start</span>
            </button>
            <button
              onClick={handleEditChild}
              className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base whitespace-nowrap"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "knowledge", label: "Knowledge Base", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                      {moodEntries.length > 0
                        ? `${averageMood.toFixed(1)}/10`
                        : "N/A"}
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
