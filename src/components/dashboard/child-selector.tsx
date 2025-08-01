"use client";

import { useState, useEffect } from "react";
import { ChevronDown, User, Plus, Edit } from "lucide-react";
import { apiGet } from "../../lib/api";

interface Child {
  id: string;
  name: string;
  age: number;
  current_concerns?: string;
  last_session_at?: string;
}

interface ChildSelectorProps {
  selectedChildId?: string;
  onChildSelect: (childId: string) => void;
  onAddChild?: () => void;
  onEditChild?: (childId: string) => void;
}

export function ChildSelector({
  selectedChildId,
  onChildSelect,
  onAddChild,
  onEditChild,
}: ChildSelectorProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChildren();

    // Listen for child data refresh events
    const handleRefreshChildren = () => {
      fetchChildren();
    };

    window.addEventListener("refreshChildren", handleRefreshChildren);

    return () => {
      window.removeEventListener("refreshChildren", handleRefreshChildren);
    };
  }, []);

  const fetchChildren = async () => {
    try {
      const data = await apiGet<{ children: Child[] }>("children");
      setChildren(data.children || []);

      // Auto-select first child if none selected
      if (!selectedChildId && data.children && data.children.length > 0) {
        onChildSelect(data.children[0].id);
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedChild = children.find((child) => child.id === selectedChildId);

  const handleEditChild = (e: React.MouseEvent, childId: string) => {
    e.stopPropagation();
    if (onEditChild) {
      onEditChild(childId);
      setIsOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-2 border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-lg p-2 border border-gray-200">
        <div className="text-center">
          <User className="h-5 w-5 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-600 mb-2">No children</p>
          {onAddChild && (
            <button
              onClick={onAddChild}
              className="bg-purple-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              Add Child
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white rounded-lg p-2 border border-gray-200 hover:border-purple-300 transition-colors w-full min-w-48"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              {selectedChild ? (
                <>
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedChild.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedChild.age} years
                  </p>
                </>
              ) : (
                <p className="font-medium text-gray-900 text-sm">
                  Select a child
                </p>
              )}
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {children.map((child) => (
              <div
                key={child.id}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  selectedChildId === child.id
                    ? "bg-purple-50 border-r-2 border-purple-500"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      onChildSelect(child.id);
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-2 flex-1 text-left"
                  >
                    <div
                      className={`w-6 h-6 min-w-6 rounded-full flex items-center justify-center ${
                        selectedChildId === child.id
                          ? "bg-gradient-to-br from-purple-400 to-blue-400"
                          : "bg-gray-200"
                      }`}
                    >
                      <User
                        className={`h-3 w-3 ${
                          selectedChildId === child.id
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {child.name}
                      </p>
                      <p className="text-xs text-gray-500">{child.age} years</p>
                    </div>
                  </button>
                  {onEditChild && (
                    <button
                      onClick={(e) => handleEditChild(e, child.id)}
                      className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                      title="Edit child information"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {onAddChild && children.length < 3 && (
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    onAddChild();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 text-sm">
                        Add another child
                      </p>
                      <p className="text-xs text-gray-500">
                        Up to 3 children per family
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
