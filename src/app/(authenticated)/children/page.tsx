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
import { apiGet, apiDelete } from "../../../lib/api";
import toast from "react-hot-toast";
import Modal from "../../../components/common/Modal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const data = await apiGet<{ children: Child[] }>("children");
      setChildren(data.children || []);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = () => {
    if (children.length >= 3) {
      toast.error(
        "You have reached the maximum limit of 3 children per family."
      );
      return;
    }
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
      await apiDelete(`children/${childToDelete.id}`);

      setChildren(children.filter((child) => child.id !== childToDelete.id));
      setShowDeleteModal(false);
      setChildToDelete(null);
      toast.success(`${childToDelete.name} has been successfully removed.`);

      // Notify other components that children data has changed
      window.dispatchEvent(new CustomEvent("refreshChildren"));
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error("Failed to delete child. Please try again.");
    }
  };

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
            disabled={children.length >= 3}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              children.length >= 3
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
            title={
              children.length >= 3
                ? "Maximum of 3 children allowed"
                : "Add Child"
            }
          >
            <Plus className="h-4 w-4" />
            <span>Add Child</span>
          </button>
        </div>
      </div>

      {/* Children Table */}
      <div className="px-6">
        {children.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No children found
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first child to Lily Heart AI
            </p>
            {children.length < 3 && (
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
                  {children.map((child) => (
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
                          {child.sessions_count || 0}{" "}
                          {(child.sessions_count || 0) <= 1
                            ? "session"
                            : "sessions"}
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
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setChildToDelete(null);
        }}
        title="Delete Child"
        type="error"
        icon={<Trash2 className="h-5 w-5" />}
        primaryButton={{
          text: "Delete",
          onClick: confirmDelete,
          className: "bg-red-600 text-white hover:bg-red-700",
        }}
        secondaryButton={{
          text: "Cancel",
          onClick: () => {
            setShowDeleteModal(false);
            setChildToDelete(null);
          },
          className: "border border-gray-300 text-gray-700 hover:bg-gray-50",
        }}
      >
        <div>
          <p className="text-sm text-gray-500 mb-4">
            This action cannot be undone
          </p>
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <strong>{childToDelete?.name}</strong>? This will permanently
            remove their profile and all associated data.
          </p>
        </div>
      </Modal>
    </>
  );
}
