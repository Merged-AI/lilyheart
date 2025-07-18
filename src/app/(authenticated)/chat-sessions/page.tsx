"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Brain, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Message {
  sender: 'child' | 'ai';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  childId: string;
  messages: Message[];
}

export default function ChatSessionsPage() {
  const router = useRouter();
  const { selectedChildId } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load chat sessions
  const loadSessions = async (page: number, isLoadMore: boolean = false) => {
    if (!selectedChildId) {
      return;
    }

    try {
      if (!isLoadMore) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(
        `/api/chat/sessions?childId=${selectedChildId}&page=${page}&pageSize=5`
      );
      if (response.ok) {
        const data = await response.json();
        if (isLoadMore) {
          setSessions(prev => [...prev, ...data.sessions]);
        } else {
          setSessions(data.sessions);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    setCurrentPage(1);
    loadSessions(1);
  }, [selectedChildId]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadSessions(nextPage, true);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

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
                    {/* Session Date */}
                    <div className="text-sm text-gray-500 mb-4">
                      Session from {formatDate(session.messages[0]?.timestamp)}
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                      {session.messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.sender === 'child' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              message.sender === 'child'
                                ? 'bg-purple-100 text-purple-900'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {message.sender === 'child' ? 'Child' : 'Dr. Emma'}
                            </div>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sessions.length > 0 && hasMore && (
            <div className="p-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <span className="flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 animate-spin mr-2" />
                    Loading...
                  </span>
                ) : (
                  'Load More Sessions'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
