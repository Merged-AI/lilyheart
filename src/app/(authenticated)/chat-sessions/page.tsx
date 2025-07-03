"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Brain, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ChatSession {
  id: string;
  childId: string;
  userMessage: string;
  aiResponse: string;
  keyTopics: string[];
}

export default function ChatSessionsPage() {
  const router = useRouter();
  const { selectedChildId } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!selectedChildId) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/chat/sessions?childId=${selectedChildId}`
        );
        if (response.ok) {
          const data = await response.json();
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [selectedChildId]);

  if (!selectedChildId && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-purple-900 mb-2">
            Select a Child
          </h2>
          <p className="text-purple-600 mb-6">
            Please select a child to view their chat sessions.
          </p>
          <button
            onClick={() => router.push("/children")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Manage Children
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Sessions List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Session History
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Chat Sessions
              </h3>
              <p className="text-purple-600">
                Fetching your child's therapy session history...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No sessions found
              </h3>
              <p className="text-gray-600">
                Start a therapy session to see chat history here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Child's Message */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Child's Message:
                      </h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                        {session.userMessage}
                      </p>
                    </div>

                    {/* AI Response */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Dr. Emma's Response:
                      </h4>
                      <div className="text-gray-700 bg-purple-50 p-3 rounded-lg whitespace-pre-wrap">
                        {session.aiResponse}
                      </div>
                    </div>

                    {/* Topics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Topics Discussed:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {session.keyTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
