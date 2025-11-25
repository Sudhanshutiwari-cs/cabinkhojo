"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const accessToken = params.get("access_token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // Set session with access token
  useEffect(() => {
    if (!accessToken) return;
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });
  }, [accessToken]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      setMessage("Invalid token.");
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    if (passwordStrength < 3) {
      setMessage("Please use a stronger password.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }

    setLoading(false);
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-gray-200";
    if (strength <= 2) return "bg-red-500";
    if (strength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength === 0) return "Enter a password";
    if (strength <= 2) return "Weak";
    if (strength === 3) return "Good";
    return "Strong";
  };

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Token</h1>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/auth/forgot-password")}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set New Password
          </h1>
          <p className="text-gray-600">
            Create a strong password to secure your account
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Password strength</span>
                  <span className={`font-medium ${
                    passwordStrength <= 2 ? "text-red-600" :
                    passwordStrength === 3 ? "text-yellow-600" : "text-green-600"
                  }`}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-3 space-y-1">
              <div className={`flex items-center text-sm ${
                password.length >= 8 ? "text-green-600" : "text-gray-400"
              }`}>
                <CheckCircle size={16} className="mr-2" />
                At least 8 characters
              </div>
              <div className={`flex items-center text-sm ${
                /[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"
              }`}>
                <CheckCircle size={16} className="mr-2" />
                One uppercase letter
              </div>
              <div className={`flex items-center text-sm ${
                /[0-9]/.test(password) ? "text-green-600" : "text-gray-400"
              }`}>
                <CheckCircle size={16} className="mr-2" />
                One number
              </div>
              <div className={`flex items-center text-sm ${
                /[^A-Za-z0-9]/.test(password) ? "text-green-600" : "text-gray-400"
              }`}>
                <CheckCircle size={16} className="mr-2" />
                One special character
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your new password"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  confirm && password !== confirm 
                    ? "border-red-300 ring-2 ring-red-100" 
                    : "border-gray-300"
                }`}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {confirm && password !== confirm && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <XCircle size={16} className="mr-1" />
                Passwords do not match
              </p>
            )}
            {confirm && password === confirm && (
              <p className="mt-2 text-sm text-green-600 flex items-center">
                <CheckCircle size={16} className="mr-1" />
                Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || password !== confirm || passwordStrength < 3}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            message.includes("successfully") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="ml-3 text-sm text-blue-700">
              Make sure your password is unique and not used for other accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}