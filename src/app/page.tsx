// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Professional Icon Components
const SunIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const BuildingIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CodeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ArrowIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function Home() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [instituteCode, setInstituteCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Allowed institute codes
  const allowedCodes = ['kit165', 'kit550', 'mit202'];

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      const isDark = saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      setDarkMode(isDark);
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
      
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!instituteCode.trim()) {
      setError('Please enter your institute code');
      return;
    }

    // Convert to lowercase for case-insensitive comparison
    const enteredCode = instituteCode.trim().toLowerCase();

    // Validate against allowed codes
    if (!allowedCodes.includes(enteredCode)) {
      setError('Invalid institute code. Please check your code and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call or validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to /entered-code with the validated code
      router.push(`/${enteredCode}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Professional theme classes - exactly like in the provided code
  const themeClasses = {
    background: darkMode 
      ? "bg-gray-900" 
      : "bg-gray-50",
    header: darkMode
      ? "bg-gray-800 border-b border-gray-700"
      : "bg-white border-b border-gray-200",
    card: darkMode 
      ? "bg-gray-800 border border-gray-700" 
      : "bg-white border border-gray-200",
    input: darkMode 
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
    button: {
      primary: darkMode 
        ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700" 
        : "bg-blue-600 hover:bg-blue-700 text-white border border-blue-700",
      secondary: darkMode
        ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
        : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
      disabled: darkMode 
        ? "bg-gray-800 text-gray-500 border-gray-700" 
        : "bg-gray-100 text-gray-400 border-gray-300"
    },
    text: {
      primary: darkMode ? "text-white" : "text-gray-900",
      secondary: darkMode ? "text-gray-300" : "text-gray-600",
      muted: darkMode ? "text-gray-400" : "text-gray-500",
      accent: darkMode ? "text-blue-400" : "text-blue-600"
    },
    status: {
      success: darkMode ? "bg-green-900/20 text-green-400 border-green-800" : "bg-green-50 text-green-700 border-green-200",
      error: darkMode ? "bg-red-900/20 text-red-400 border-red-800" : "bg-red-50 text-red-700 border-red-200",
      info: darkMode ? "bg-blue-900/20 text-blue-400 border-blue-800" : "bg-blue-50 text-blue-700 border-blue-200"
    }
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      {/* Navigation */}
      <header className={`${themeClasses.header} sticky top-0 z-50 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                darkMode ? "" : ""
              }`}>
                <img 
                  src="/Logo_main.png" 
                  alt="Logo" 
                  className="w-18 h-18 object-contain"
                />
              </div>
              <div>
                <h1 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Cabin Khojo</h1>
                <p className={`text-xs ${themeClasses.text.muted}`}>Institute Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  darkMode 
                    ? "bg-gray-700 border-gray-600 hover:bg-gray-600 text-yellow-400" 
                    : "bg-white border-gray-300 hover:bg-gray-50 text-gray-600"
                }`}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-4`}>
            Welcome to Cabin Khojo
          </h1>
          <p className={`text-xl ${themeClasses.text.secondary} max-w-2xl mx-auto`}>
            Enter your institute code to access the staff management and campus navigation system
          </p>
        </div>

        {/* Institute Code Input Section */}
        <div className="max-w-sm mx-auto">
  <div className={`rounded-lg ${themeClasses.card} p-6 border-l-4 border-blue-600 shadow-md`}>
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
      darkMode ? "bg-blue-900/30" : "bg-blue-50"
    }`}>
      <BuildingIcon className={`w-8 h-8 ${themeClasses.text.accent}`} />
    </div>
    
    <h2 className={`text-xl font-bold ${themeClasses.text.primary} mb-2 text-center`}>
      Institute Code
    </h2>
    
    <p className={`${themeClasses.text.secondary} mb-4 text-center text-sm`}>
      Enter your unique institute code
    </p>

    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CodeIcon className={`w-4 h-4 ${themeClasses.text.muted}`} />
          </div>
          <input
            id="instituteCode"
            type="text"
            value={instituteCode}
            onChange={(e) => setInstituteCode(e.target.value)}
            placeholder="e.g., kit165, kit550, mit202"
            className={`block w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              themeClasses.input
            } ${error ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
        </div>
        {error && (
          <p className={`mt-1 text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !instituteCode.trim()}
        className={`w-full py-2 px-4 rounded-lg border text-sm font-medium transition-all flex items-center justify-center ${
          isLoading || !instituteCode.trim()
            ? themeClasses.button.disabled
            : themeClasses.button.primary
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Verifying...
          </>
        ) : (
          'Continue to Portal'
        )}
      </button>
    </form>

   
  </div>
</div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className={`rounded-lg ${themeClasses.card} p-6 transition-colors duration-300 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
              darkMode ? "bg-blue-900/30" : "bg-blue-50"
            }`}>
              <BuildingIcon className={`w-6 h-6 ${themeClasses.text.accent}`} />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Staff Directory</h3>
            <p className={`text-sm ${themeClasses.text.secondary}`}>
              Access comprehensive staff information and contact details
            </p>
          </div>

          <div className={`rounded-lg ${themeClasses.card} p-6 transition-colors duration-300 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
              darkMode ? "bg-green-900/30" : "bg-green-50"
            }`}>
              <CodeIcon className={`w-6 h-6 ${darkMode ? "text-green-400" : "text-green-600"}`} />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Campus Navigation</h3>
            <p className={`text-sm ${themeClasses.text.secondary}`}>
              Find offices, cabins, and facilities with interactive maps
            </p>
          </div>

          <div className={`rounded-lg ${themeClasses.card} p-6 transition-colors duration-300 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${
              darkMode ? "bg-purple-900/30" : "bg-purple-50"
            }`}>
              <ArrowIcon className={`w-6 h-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Secure Access</h3>
            <p className={`text-sm ${themeClasses.text.secondary}`}>
              Protected portal access with institute code verification
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${
        darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
      } transition-colors duration-300 mt-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                © 2025 Cabin Khojo
              </p>
            </div>
            <div>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                Institutional Portal System
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}