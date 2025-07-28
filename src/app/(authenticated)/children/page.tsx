"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  User,
  MessageCircle,
  Loader2,
} from "lucide-react";

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
}

export default function ChildrenManagementPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/children");
      if (response.ok) {
        const data = await response.json();
        setChildren(data.children || []);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = () => {
    router.push("/children/add");
  };

  const handleEditChild = (childId: string) => {
    router.push(`/children/add?childId=${childId}`);
  };

  const handleViewChild = (childId: string) => {
    router.push(`/children/${childId}`);
  };

  const handleDeleteChild = async (child: Child) => {
    setChildToDelete(child);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!childToDelete) return;

    try {
      const response = await fetch(`/api/children/${childToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChildren(children.filter((child) => child.id !== childToDelete.id));
        setShowDeleteModal(false);
        setChildToDelete(null);
      } else {
        alert("Failed to delete child. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting child:", error);
      alert("Failed to delete child. Please try again.");
    }
  };

  const filteredChildren = children.filter((child) => {
    const matchesSearch = child.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "alerts" && child.has_alerts) ||
      (filterStatus === "recent" && child.last_session_at);
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Child Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your children's profiles and view their progress
            </p>
          </div>
          <button
            onClick={handleAddChild}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Child</span>
          </button>
        </div>
      </div>

      {/* Children Table */}
      <div className="px-6">
        {filteredChildren.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No children found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first child to Lily Heart"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <button
                onClick={handleAddChild}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Add Your First Child
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Child
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age & Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Session
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredChildren.map((child) => (
                    <tr key={child.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {child.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {child.current_concerns?.substring(0, 50)}
                              {child.current_concerns?.length > 50 && "..."}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {child.age} years old
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {child.gender || "Not specified"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <MessageCircle className="h-4 w-4 text-purple-600 mr-1" />
                          {child.sessions_count || 0} sessions
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {child.last_session_at
                          ? new Date(child.last_session_at).toLocaleDateString()
                          : "No sessions yet"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewChild(child.id)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditChild(child.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteChild(child)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && childToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete Child
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <strong>{childToDelete.name}</strong>? This will permanently
              remove their profile and all associated data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChildToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
