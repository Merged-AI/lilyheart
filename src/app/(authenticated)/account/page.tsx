"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SubscriptionManagement from "@/components/payment/subscription-management";
import { Settings } from "lucide-react";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { family } = useAuth();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "subscription") {
      setTimeout(() => {
        const subscriptionElement = document.getElementById(
          "subscription-section"
        );
        if (subscriptionElement) {
          subscriptionElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
  }, [searchParams]);

  if (!family) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Loading your account
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch your information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Account Overview - Left Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Account Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Account Details
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Parent Name</p>
                  <p className="font-medium text-gray-900">
                    {family.parent_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">
                    {family.parent_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Family Name</p>
                  <p className="font-medium text-gray-900">
                    {family.family_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Status
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900">
                    {family.created_at
                      ? new Date(family.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Type</p>
                  <p className="font-medium text-gray-900">Family Plan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Management - Right Column (spans 2 columns) */}
          <div className="xl:col-span-2">
            <div
              id="subscription-section"
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6 lg:p-8">
                <SubscriptionManagement />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
