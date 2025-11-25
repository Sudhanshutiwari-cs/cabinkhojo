import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Debug all search params
  console.log("🔍 [SERVER] All searchParams:", JSON.stringify(params, null, 2));
  
  // Try different possible parameter names
  const accessToken = 
    params.access_token ||
    params.token ||
    params.code ||
    params.accessToken;

  const tokenValue = Array.isArray(accessToken) ? accessToken[0] : accessToken;

  console.log("🔍 [SERVER] Extracted token:", tokenValue ? `Present (${tokenValue.substring(0, 20)}...)` : "NULL");

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordClient serverAccessToken={tokenValue || null} />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading</h1>
        <p className="text-gray-600">Preparing your password reset...</p>
      </div>
    </div>
  );
}