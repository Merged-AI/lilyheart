"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  Brain,
  Heart,
  TrendingUp,
  Users,
  Star,
  Lock,
  Shield,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          setIsAuthenticated(true);
          router.replace("/dashboard");
        } else {
          // User is not authenticated, show landing page
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Error or no auth, show landing page
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-purple-700">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show redirecting message
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <p className="text-purple-700">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Render landing page content for unauthenticated users
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 sticky top-0 z-50 backdrop-blur-lg">
        <nav className="max-w-[1400px] mx-auto flex justify-between items-center py-4 px-6">
          <Link
            href="/"
            className="flex items-center space-x-3 text-white text-xl font-semibold"
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <span style={{ fontFamily: "var(--font-poppins)" }}>
              Lily Heart
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#how-it-works"
              className="text-white hover:opacity-80 transition-opacity font-medium"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              className="text-white hover:opacity-80 transition-opacity font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-white hover:opacity-80 transition-opacity font-medium"
            >
              Sign In
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full font-semibold hover:transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
            >
              Start Free Trial
            </Link>
            <Link
              href="/auth/login"
              className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center overflow-hidden">
        {/* Floating Background Element */}
        <div className="absolute top-0 right-0 w-full h-full">
          <div className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-gradient-to-br from-purple-100/30 to-blue-100/30 rounded-full animate-pulse-slow transform rotate-12"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Hero Content */}
          <div className="space-y-8">
            <h1
              className="text-5xl lg:text-6xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Family Communication{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Coach for Kids
              </span>
            </h1>

            <p
              className="text-xl text-gray-600 max-w-lg"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              AI-powered emotional support that helps your family build better
              communication, providing insights into conversation patterns and
              emotional growth.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="group bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#pricing"
                className="group bg-white border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2"
              >
                View Pricing
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              ✨ 7-day free trial • No credit card required • Cancel anytime
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                End-to-End Encrypted
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Child Safety First
              </div>
            </div>
          </div>

          {/* AI Chat Mockup */}
          <div className="flex justify-center items-center">
            <div className="relative">
              <div className="w-80 h-[600px] bg-gradient-to-b from-purple-600 to-indigo-700 rounded-3xl p-5 shadow-2xl animate-bounce-slow">
                <div className="w-full h-full bg-white rounded-2xl p-6 flex flex-direction-column justify-start">
                  <div className="space-y-4">
                    {/* AI Therapist Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          Dr. Emma AI
                        </p>
                        <p className="text-xs text-green-500">● Online</p>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-2xl rounded-tl-md max-w-[80%] text-sm">
                        "Hi there! I'm Dr. Emma. How are you feeling today?"
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tr-md max-w-[80%] text-sm">
                        "I had a tough day at school..."
                      </div>
                    </div>

                    <div className="flex justify-start">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-2xl rounded-tl-md max-w-[80%] text-sm">
                        "I'm sorry to hear that. Would you like to tell me what
                        happened?"
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tr-md max-w-[80%] text-sm">
                        "Some kids were being mean to me 😢"
                      </div>
                    </div>

                    {/* Mood Analysis Indicator */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                        <span className="font-medium text-orange-700">
                          Mood Analysis
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sadness:</span>
                          <span className="text-orange-600 font-medium">
                            75%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stress:</span>
                          <span className="text-red-600 font-medium">60%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3
                className="font-semibold text-lg"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Family Safe AI
              </h3>
              <p
                className="text-gray-600 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Designed for family communication & emotional support
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3
                className="font-semibold text-lg"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                5,000+ Families
              </h3>
              <p
                className="text-gray-600 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Building stronger communication together
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3
                className="font-semibold text-lg"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Expert AI Coach
              </h3>
              <p
                className="text-gray-600 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Based on proven communication techniques
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3
                className="font-semibold text-lg"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                4.9/5 Rating
              </h3>
              <p
                className="text-gray-600 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Highly rated by families & professionals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
      >
        <div className="max-w-[1400px] mx-auto px-6">
          <h2
            className="text-4xl font-bold text-center text-gray-900 mb-16"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            How Lily Heart Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Safe Conversations",
                description:
                  "Your child chats with Dr. Emma AI in a safe, non-judgmental environment designed specifically for kids.",
                icon: MessageCircle,
              },
              {
                step: "2",
                title: "AI Analysis",
                description:
                  "Advanced AI analyzes conversation patterns, emotions, and mood indicators using child psychology principles.",
                icon: Brain,
              },
              {
                step: "3",
                title: "Parent Insights",
                description:
                  "You receive detailed mood reports, concerning pattern alerts, and professional recommendations.",
                icon: TrendingUp,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">{item.step}</span>
                </div>
                <h3
                  className="text-xl font-semibold text-purple-600 mb-4"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Simple, Transparent Pricing
            </h2>
            <p
              className="text-xl text-gray-600 max-w-2xl mx-auto"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              No decision fatigue. No hidden costs. Everything your family needs
              to build better communication.
            </p>
          </div>

          {/* Single Plan Card */}
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Family Communication Coach
                </h3>
                <p className="text-purple-100 mb-6">
                  Everything your family needs to thrive
                </p>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-5xl font-bold">$39</span>
                  <span className="text-purple-200 text-lg">/month</span>
                </div>
                <p className="text-purple-100 text-sm mt-2">
                  7-day free trial • Cancel anytime
                </p>
              </div>

              {/* Features */}
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Unlimited AI Conversations
                      </p>
                      <p className="text-sm text-gray-600">
                        24/7 emotional support for up to 4 family members
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Parent Dashboard
                      </p>
                      <p className="text-sm text-gray-600">
                        Real-time insights into family communication patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Appointment Preparation Tools
                      </p>
                      <p className="text-sm text-gray-600">
                        Organize thoughts and progress for healthcare visits
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Family Progress Tracking
                      </p>
                      <p className="text-sm text-gray-600">
                        Monitor communication growth and emotional wellness
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Age-Appropriate AI Coaching
                      </p>
                      <p className="text-sm text-gray-600">
                        Tailored conversations for children ages 3-18
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Crisis Support Resources
                      </p>
                      <p className="text-sm text-gray-600">
                        Immediate guidance and professional referrals when
                        needed
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/auth/register"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 text-center transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <span>Start Your Free Trial</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <p className="text-center text-gray-500 text-sm mt-4">
                  No credit card required for trial
                </p>
              </div>
            </div>
          </div>

          {/* Why One Plan? */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h3
              className="text-2xl font-bold text-gray-900 mb-8 text-center"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Why One Simple Plan?
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-purple-600" />
                </div>
                <h4
                  className="font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  No Decision Fatigue
                </h4>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  When your family needs support, the last thing you need is
                  complicated pricing tiers. One plan gives you everything,
                  immediately.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4
                  className="font-semibold text-gray-900 mb-2"
                  style={{ fontFamily: "var(--font-poppins)" }}
                >
                  Complete Family Coverage
                </h4>
                <p
                  className="text-gray-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Every feature included from day one. No upgrades needed as
                  your family grows or your communication needs evolve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <p
            className="text-2xl italic text-gray-600 mb-8 leading-relaxed"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            "Lily Heart transformed how our family communicates. My kids
            actually open up more, and the insights help me understand their
            emotional needs better."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              JK
            </div>
            <div className="text-left">
              <p
                className="font-semibold text-gray-900"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Jennifer K.
              </p>
              <p
                className="text-gray-500 text-sm"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Mother of 2, Family Coach
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-20 text-white text-center">
        <div className="max-w-[1400px] mx-auto px-6">
          <h2
            className="text-4xl font-bold mb-6"
            style={{ fontFamily: "var(--font-poppins)" }}
          >
            Ready to Transform Your Family Communication?
          </h2>
          <p
            className="text-xl mb-4 opacity-90"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Join thousands of families building stronger emotional connections
          </p>
          <p
            className="text-lg mb-8 opacity-80"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Everything your family needs for just $39/month • 7-day free trial
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl inline-flex items-center gap-2"
            >
              <ArrowRight className="h-5 w-5" />
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-2xl inline-block"
            >
              View Full Pricing
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-70">
            No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Main Content */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-poppins)" }}
              >
                Lily Heart
              </span>
            </div>
            <p
              className="text-gray-400 text-sm"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              AI-powered family communication coach
            </p>
          </div>

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p
                  className="text-gray-300 text-xs leading-relaxed"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <strong>Disclaimer:</strong> Lily Heart (lilyheart.ai) is an
                  AI mental wellness tool, not a licensed therapist or medical
                  service. It does not offer diagnosis, treatment, or
                  professional mental health advice. For emergencies, contact
                  local crisis services.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-700 pt-4 text-center">
            <p
              className="text-gray-500 text-xs"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              © {new Date().getFullYear()} Lily Heart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
