"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setMessage(error.message);
      setIsSuccess(false);
    } else {
      setMessage("Password reset link sent! Check your email inbox.");
      setIsSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Back to Login */}
        <Link 
          href="/auth/login"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to login
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleForgot} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={20} className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSuccess}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || isSuccess}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Sending Reset Link...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 size={20} className="mr-2" />
                Link Sent!
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg border ${
            isSuccess 
              ? "bg-green-50 text-green-800 border-green-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {isSuccess ? (
                  <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                )}
              </div>
              <p className="ml-3 text-sm">{message}</p>
            </div>
          </div>
        )}

        {/* Success Instructions */}
        {isSuccess && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">What's next?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your email inbox</li>
              <li>• Click the reset link in the email</li>
              <li>• Create your new password</li>
              <li>• Return here to log in</li>
            </ul>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-gray-600">
              The reset link will expire in 24 hours for security reasons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}