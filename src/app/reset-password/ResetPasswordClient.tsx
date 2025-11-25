"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ResetPasswordClientProps {
  serverAccessToken: string | null;
}

export default function ResetPasswordClient({ serverAccessToken }: ResetPasswordClientProps) {
  const router = useRouter();
  const clientSearchParams = useSearchParams();
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [finalToken, setFinalToken] = useState<string | null>(null);

  // Get token from client-side URL as fallback
  useEffect(() => {
    console.log("🔍 [CLIENT] Props serverAccessToken:", serverAccessToken);
    
    const clientToken = clientSearchParams.get('access_token') || 
                       clientSearchParams.get('token') || 
                       clientSearchParams.get('code') ||
                       clientSearchParams.get('accessToken');
    
    console.log("🔍 [CLIENT] Client-side token:", clientToken);

    // Use client-side token if server token is null
    if (!serverAccessToken && clientToken) {
      console.log("🔄 [CLIENT] Using client-side token as fallback");
      setFinalToken(clientToken);
      setDebugInfo(`Using client token: ${clientToken.substring(0, 20)}...`);
    } else if (serverAccessToken) {
      console.log("🔄 [CLIENT] Using server-provided token");
      setFinalToken(serverAccessToken);
      setDebugInfo(`Using server token: ${serverAccessToken.substring(0, 20)}...`);
    } else {
      console.log("❌ [CLIENT] No token available from server or client");
      setFinalToken(null);
      setDebugInfo("No token available from server or client URL");
      setIsValidToken(false);
    }
  }, [serverAccessToken, clientSearchParams]);

  // Password strength checker
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  // Verify token and set session
  useEffect(() => {
    const verifyToken = async () => {
      if (!finalToken) {
        console.log("❌ [CLIENT] No finalToken available for verification");
        return;
      }

      console.log("🔄 [CLIENT] Starting token verification with:", finalToken.substring(0, 20) + "...");
      setDebugInfo(`Verifying token: ${finalToken.substring(0, 20)}...`);

      try {
        // Method 1: Try verifyOtp first (for newer Supabase versions)
        console.log("🔄 [CLIENT] Trying verifyOtp method...");
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: finalToken,
          type: 'recovery'
        });

        console.log("📋 [CLIENT] verifyOtp response:", { data: verifyData, error: verifyError });

        if (!verifyError && verifyData) {
          console.log("✅ [CLIENT] Token verified successfully via verifyOtp");
          setDebugInfo("Token verified successfully via verifyOtp");
          setIsValidToken(true);
          return;
        }

        console.log("⚠️ [CLIENT] verifyOtp failed, trying exchangeCodeForSession...");
        setDebugInfo("verifyOtp failed, trying exchangeCodeForSession...");

        // Method 2: Try exchangeCodeForSession (alternative method)
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(finalToken);
        
        console.log("📋 [CLIENT] exchangeCodeForSession response:", { data: exchangeData, error: exchangeError });

        if (!exchangeError && exchangeData) {
          console.log("✅ [CLIENT] Token verified successfully via exchangeCodeForSession");
          setDebugInfo("Token verified successfully via exchangeCodeForSession");
          setIsValidToken(true);
          return;
        }

        console.log("⚠️ [CLIENT] Both methods failed, token might be invalid or expired");
        console.log("❌ [CLIENT] verifyOtp error:", verifyError?.message);
        console.log("❌ [CLIENT] exchangeCodeForSession error:", exchangeError?.message);
        setDebugInfo(`Token verification failed: ${verifyError?.message || exchangeError?.message}`);
        setIsValidToken(false);

      } catch (error) {
        console.error("💥 [CLIENT] Token verification crashed:", error);
        setDebugInfo(`Verification crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsValidToken(false);
      }
    };

    if (finalToken) {
      verifyToken();
    }
  }, [finalToken]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔄 [CLIENT] handleReset called");
    console.log("🔍 [CLIENT] Current state - isValidToken:", isValidToken, "finalToken:", finalToken ? "Present" : "Missing");

    if (!finalToken || !isValidToken) {
      setMessage("Invalid or expired token.");
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

    try {
      console.log("🔄 [CLIENT] Attempting password update...");
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      console.log("📋 [CLIENT] Password update response - error:", error);

      if (error) {
        setMessage(`Error: ${error.message}`);
        console.error("❌ [CLIENT] Password update failed:", error);
      } else {
        setMessage("Password updated successfully! Redirecting to login...");
        console.log("✅ [CLIENT] Password updated successfully");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (error) {
      console.error("💥 [CLIENT] Password reset crashed:", error);
      setMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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

  // Show loading while checking token
  if (isValidToken === null && finalToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Link</h1>
          <p className="text-gray-600 mb-4">Checking your reset link...</p>
          {debugInfo && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-mono break-all">Debug: {debugInfo}</p>
              <p className="text-xs text-yellow-600 mt-1">Token: {finalToken.substring(0, 30)}...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show invalid token message
  if (!isValidToken || !finalToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h1>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          {debugInfo && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 font-mono break-all">Debug: {debugInfo}</p>
              <p className="text-xs text-red-600 mt-1">Server Token: {serverAccessToken ? "Provided" : "NULL"}</p>
              <p className="text-xs text-red-600">Final Token: {finalToken ? "Available" : "NULL"}</p>
            </div>
          )}
          <button
            onClick={() => router.push("/auth/forgot-password")}
            className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

        {/* Debug Info */}
        {debugInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-mono break-all">Status: {debugInfo}</p>
            <p className="text-xs text-blue-600 mt-1">Token: {finalToken.substring(0, 30)}...</p>
            <p className="text-xs text-blue-600">Server Token: {serverAccessToken ? "Provided" : "NULL"}</p>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-6">
          {/* Rest of your form remains the same */}
          {/* ... (form content unchanged) ... */}
        </form>
      </div>
    </div>
  );
}