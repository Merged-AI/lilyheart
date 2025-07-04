"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Heart, AlertTriangle, Lock } from "lucide-react";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Heart Harbor</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1
              className="text-3xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Terms of Use
            </h1>
            <p
              className="text-lg text-gray-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Last updated:{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="prose prose-lg max-w-none space-y-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3
                    className="text-lg font-semibold text-red-800 mb-2"
                    style={{ fontFamily: "var(--font-poppins)" }}
                  >
                    Important Notice
                  </h3>
                  <p
                    className="text-red-700"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Heart Harbor is an AI family communication tool designed to
                    offer support and helpful insights. It is NOT a licensed
                    therapist and NOT a substitute for professional care. For
                    emergencies, contact local crisis services immediately.
                  </p>
                </div>
              </div>
            </div>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                1. Acceptance of Terms
              </h2>
              <p
                className="text-gray-700 leading-relaxed"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                By accessing and using Heart Harbor ("the Service"), you accept
                and agree to be bound by the terms and provision of this
                agreement. If you do not agree to abide by the above, please do
                not use this service.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                2. Service Description
              </h2>
              <p
                className="text-gray-700 leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Heart Harbor is an AI-powered family communication platform that
                provides:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  AI-assisted conversation support for family communication
                </li>
                <li>Emotional wellness insights and mood tracking</li>
                <li>Family communication pattern analysis</li>
                <li>Educational resources for family bonding</li>
                <li>Progress tracking and reporting features</li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                3. Medical Disclaimer
              </h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p
                  className="text-orange-800 font-medium"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  CRITICAL: Heart Harbor is not a medical service, therapy, or
                  mental health treatment.
                </p>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  The Service does not provide medical advice, diagnosis, or
                  treatment
                </li>
                <li>
                  AI responses are for informational and support purposes only
                </li>
                <li>
                  Always consult qualified healthcare professionals for medical
                  concerns
                </li>
                <li>
                  In case of emergency, call 911 or your local emergency
                  services
                </li>
                <li>
                  For crisis support: Canada (1-833-456-4566) or U.S. (988)
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                4. User Responsibilities
              </h2>
              <p
                className="text-gray-700 leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                As a user of Heart Harbor, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Use the Service only for its intended purpose of family
                  communication support
                </li>
                <li>
                  Provide accurate and complete information when setting up
                  profiles
                </li>
                <li>Supervise children's use of the Service appropriately</li>
                <li>Not use the Service for any illegal or harmful purposes</li>
                <li>Respect the privacy and safety of all family members</li>
                <li>
                  Seek professional help when needed, especially in crisis
                  situations
                </li>
                <li>Maintain the security of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                5. Privacy and Data Protection
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p
                      className="text-blue-800 font-medium"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      Your privacy and data security are our top priorities.
                    </p>
                  </div>
                </div>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>All conversations are encrypted and stored securely</li>
                <li>
                  Personal data is used only to provide and improve the Service
                </li>
                <li>
                  We do not sell or share your personal information with third
                  parties
                </li>
                <li>You can request deletion of your data at any time</li>
                <li>
                  Children's data is protected under COPPA compliance standards
                </li>
                <li>
                  Family data is kept private and not shared outside your family
                  account
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                6. Age Requirements and Parental Consent
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  Heart Harbor is designed for families with children ages 3-18
                </li>
                <li>Parental supervision is required for children under 13</li>
                <li>
                  Parents must provide consent for children's use of the Service
                </li>
                <li>
                  Children's accounts must be created and managed by parents
                </li>
                <li>
                  Parents have full access to children's conversation history
                  and data
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                7. Limitations of Service
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>
                  AI responses are generated based on available data and may not
                  always be accurate
                </li>
                <li>
                  The Service may not be available 24/7 due to maintenance or
                  technical issues
                </li>
                <li>
                  We do not guarantee specific outcomes from using the Service
                </li>
                <li>
                  The Service is not a replacement for professional mental
                  health care
                </li>
                <li>
                  We reserve the right to modify or discontinue features at any
                  time
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                8. Prohibited Uses
              </h2>
              <p
                className="text-gray-700 leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                You may not use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Harass, abuse, or harm others</li>
                <li>Share inappropriate or harmful content</li>
                <li>Attempt to manipulate or deceive the AI system</li>
                <li>Use automated tools or bots to access the Service</li>
                <li>Violate any applicable laws or regulations</li>
                <li>
                  Attempt to gain unauthorized access to other users' accounts
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                9. Account Termination
              </h2>
              <p
                className="text-gray-700 leading-relaxed"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                We reserve the right to terminate or suspend your account at any
                time for violations of these terms. You may also cancel your
                subscription at any time through your account settings.
              </p>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                10. Contact Information
              </h2>
              <p
                className="text-gray-700 leading-relaxed"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                If you have questions about these Terms of Use, please contact
                us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-700">
                  Email: support@heart-harbor.com
                  <br />
                  Website: https://heart-harbor.com
                  <br />
                  Support Hours: Monday - Friday, 9 AM - 6 PM EST
                </p>
              </div>
            </section>

            <section>
              <h2
                className="text-2xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                11. Emergency Resources
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3
                  className="text-lg font-semibold text-red-800 mb-3"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  If you are in crisis or need immediate help:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <p className="font-semibold text-gray-900">Canada</p>
                    <p className="text-gray-700">Talk Suicide Canada</p>
                    <button
                      onClick={() => window.open("tel:1-833-456-4566")}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      1-833-456-4566
                    </button>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <p className="font-semibold text-gray-900">United States</p>
                    <p className="text-gray-700">Suicide & Crisis Lifeline</p>
                    <button
                      onClick={() => window.open("tel:988")}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Call or text 988
                    </button>
                  </div>
                </div>
                <p className="text-red-700 text-sm mt-4">
                  For immediate emergencies: Call 911 or your local emergency
                  services.
                </p>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-200 mt-12 pt-8 text-center">
            <p
              className="text-gray-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              By using Heart Harbor, you acknowledge that you have read,
              understood, and agree to these Terms of Use.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors mt-4"
            >
              <Heart className="h-5 w-5" />
              <span className="font-medium">Return to Heart Harbor</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
