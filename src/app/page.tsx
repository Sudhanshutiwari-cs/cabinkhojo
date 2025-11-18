"use client";

import { useState, KeyboardEvent } from "react";
import { supabase } from "../lib/supabase";

interface Teacher {
  id: number;
  name: string;
  cabin_number: string;
  department: string;
}

type TeacherState = Teacher[] | "notfound" | null;

// Minimalist Icon Components
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UserIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LocationIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const DepartmentIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SunIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function Home() {
  const [query, setQuery] = useState<string>("");
  const [teachers, setTeachers] = useState<TeacherState>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const searchTeacher = async (): Promise<void> => {
    if (!query.trim()) return;
    
    setLoading(true);
    setTeachers(null);
    setIsExpanded(true);

    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .ilike("name", `%${query}%`);

      if (error) {
        console.error("Error searching teacher:", error);
        return;
      }

      setTeachers(data?.length > 0 ? data : "notfound");
    } catch (error) {
      console.error("Error searching teacher:", error);
      setTeachers("notfound");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      searchTeacher();
    }
  };

  const clearSearch = (): void => {
    setQuery("");
    setTeachers(null);
    setIsExpanded(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Theme classes based on dark mode state
  const themeClasses = {
    background: darkMode 
      ? "bg-gradient-to-br from-gray-900 to-gray-800" 
      : "bg-white",
    card: darkMode 
      ? "bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-900/20" 
      : "bg-white border-gray-100 hover:shadow-md",
    input: darkMode 
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-transparent" 
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-transparent",
    button: {
      primary: darkMode 
        ? "bg-blue-600 hover:bg-blue-500 text-white" 
        : "bg-gray-900 hover:bg-gray-800 text-white",
      disabled: darkMode 
        ? "bg-gray-700 text-gray-400" 
        : "bg-gray-300 text-gray-500"
    },
    text: {
      primary: darkMode ? "text-white" : "text-gray-900",
      secondary: darkMode ? "text-gray-300" : "text-gray-600",
      muted: darkMode ? "text-gray-400" : "text-gray-500"
    },
    icon: {
      user: darkMode 
        ? "bg-blue-900/30 text-blue-400" 
        : "bg-blue-50 text-blue-600",
      location: darkMode 
        ? "bg-blue-900/30 text-blue-400" 
        : "bg-blue-100 text-blue-600",
      department: darkMode 
        ? "text-gray-300" 
        : "text-gray-400"
    },
    section: {
      cabin: darkMode 
        ? "bg-gray-700/50 border-gray-600" 
        : "bg-gray-50 border-gray-200",
      notfound: darkMode 
        ? "bg-gray-800 border-gray-700" 
        : "bg-white border-gray-100",
      initial: darkMode 
        ? "bg-gray-800 text-gray-300" 
        : "bg-gray-100 text-gray-400"
    },
    footer: darkMode 
      ? "border-gray-700 text-gray-400" 
      : "border-gray-100 text-gray-400"
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} flex flex-col items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-300`}>
      
      {/* Theme Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-6 right-6 z-20 p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
          darkMode 
            ? "bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400" 
            : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
        }`}
      >
        {darkMode ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
      </button>

      {/* Header */}
      <div className="w-full max-w-2xl mx-auto mb-8 sm:mb-12 mt-8">
        <div className="text-center">
          <h1 className={`text-3xl sm:text-4xl font-light ${themeClasses.text.primary} mb-3 tracking-tight`}>
            Cabin Khojo
          </h1>
          <p className={`${themeClasses.text.secondary} text-sm sm:text-base font-normal`}>
            Find teacher cabins and departments
          </p>
        </div>
      </div>

      {/* Main Search Card */}
      <div className={`w-full max-w-2xl mx-auto transition-all duration-500 ease-in-out ${
        isExpanded ? 'mb-8' : 'mb-0'
      }`}>
        <div className={`rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${themeClasses.card}`}>
          {/* Search Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <SearchIcon className={`w-5 h-5 ${themeClasses.text.muted}`} />
            </div>
            <input
              type="text"
              placeholder="Search by teacher name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className={`w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${themeClasses.input}`}
            />
            {query && (
              <button
                onClick={clearSearch}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors duration-200 ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <CloseIcon className={`w-4 h-4 ${themeClasses.text.muted}`} />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={searchTeacher}
            disabled={loading || !query.trim()}
            className={`w-full mt-6 py-4 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
              loading || !query.trim() 
                ? themeClasses.button.disabled 
                : themeClasses.button.primary
            }`}
          >
            {loading ? (
              <>
                <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
                  darkMode ? "border-gray-400 border-t-transparent" : "border-gray-500 border-t-transparent"
                }`} />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className="w-5 h-5" />
                Search Faculty
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* No Results State */}
        {teachers === "notfound" && (
          <div className={`rounded-2xl border p-8 text-center animate-fade-in ${themeClasses.section.notfound}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              darkMode ? "bg-gray-700" : "bg-gray-100"
            }`}>
              <UserIcon className={`w-8 h-8 ${themeClasses.text.muted}`} />
            </div>
            <h3 className={`text-lg font-medium ${themeClasses.text.primary} mb-2`}>No matches found</h3>
            <p className={themeClasses.text.muted}>
              No faculty found for "<span className={themeClasses.text.primary}>{query}</span>"
            </p>
          </div>
        )}

        {/* Multiple Teachers */}
        {teachers && teachers !== "notfound" && teachers.length > 1 && (
          <div className="text-center mb-6 animate-fade-in">
            <p className={themeClasses.text.secondary}>
              Found {teachers.length} results for "<span className={themeClasses.text.primary}>{query}</span>"
            </p>
          </div>
        )}

        {/* Teacher Cards */}
        {teachers && teachers !== "notfound" && (
          <div className="space-y-4 animate-fade-in">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className={`rounded-2xl border p-6 transition-all duration-300 ${themeClasses.card}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${themeClasses.icon.user}`}>
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${themeClasses.text.primary}`}>{teacher.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <DepartmentIcon className={`w-4 h-4 ${themeClasses.icon.department}`} />
                        <span className={`text-sm ${themeClasses.text.secondary}`}>{teacher.department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cabin Info */}
                <div className={`rounded-xl p-4 border ${themeClasses.section.cabin}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${themeClasses.icon.location}`}>
                        <LocationIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className={`text-xs uppercase tracking-wide ${themeClasses.text.muted}`}>Cabin Number</p>
                        <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{teacher.cabin_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${themeClasses.text.muted}`}>Main Building</p>
                      <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Floor 2</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Initial State */}
        {!teachers && !loading && (
          <div className="text-center py-12">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${themeClasses.section.initial}`}>
              <UserIcon className="w-10 h-10" />
            </div>
            <h3 className={`text-lg font-medium ${themeClasses.text.primary} mb-2`}>Search for faculty</h3>
            <p className={`${themeClasses.text.muted} text-sm max-w-sm mx-auto`}>
              Enter a teacher's name to find their cabin location and department information
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 w-full max-w-2xl mx-auto">
        <div className={`text-center py-6 border-t ${themeClasses.footer}`}>
          <p className="text-sm">
            Faculty Locator • <span className={darkMode ? "text-gray-500" : "text-gray-600"}>Quick cabin finding</span>
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}