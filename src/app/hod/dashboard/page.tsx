'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { GatePass } from '@/types';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiFilter, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiUser, 
  FiBook, 
  FiCalendar,
  FiHash,
  FiMessageSquare,
  FiRefreshCw,
  FiAlertCircle,
  FiDownload,
  FiAward,
  FiLogOut,
  FiUsers,
  FiList,
  FiArrowUp,
  FiArrowDown,
  FiFileText,
  FiCheck,
  FiSquare,
  FiSearch,
  FiX
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  name: string;
  roll: string;
  department: string;
  role: 'student' | 'hod' | 'guard';
  created_at: string;
  year: number;
}

interface GatePassWithStudent extends GatePass {
  student: {
    id: string;
    name: string;
    roll: string;
    department: string;
    role: 'student' | 'hod' | 'guard';
    created_at: string;
    year: number;
  };
  hod_id: string;
}

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
}

interface QRCodeData {
  passId: string;
  studentId: string;
  timestamp: string;
  department: string | null;
}

interface Student {
  id: string;
  name: string;
  roll: string;
  department: string;
  role: string;
  created_at: string;
  year: number;
}

type ViewMode = 'gatepasses' | 'students';

// Professional Icon Components from code 2
const MoonIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default function HODRequests() {
  const router = useRouter();
  const [gatePasses, setGatePasses] = useState<GatePassWithStudent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'used'>('all');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('gatepasses');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [promoteDemoteLoading, setPromoteDemoteLoading] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<number | 'all' | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [batchOperationLoading, setBatchOperationLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Professional theme classes from code 2
  const themeClasses = {
    background: darkMode 
      ? "bg-gray-900" 
      : "bg-gradient-to-br from-gray-50 to-gray-100",
    header: darkMode
      ? "bg-gray-800 border-b border-gray-700"
      : "bg-white border-b border-gray-200",
    card: darkMode 
      ? "bg-gray-800 border border-gray-700" 
      : "bg-white border border-gray-100",
    text: {
      primary: darkMode ? "text-white" : "text-gray-900",
      secondary: darkMode ? "text-gray-300" : "text-gray-600",
      muted: darkMode ? "text-gray-400" : "text-gray-500",
    },
    button: {
      secondary: darkMode
        ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    checkUserRoleAndDepartment();
  }, []);

  useEffect(() => {
    if (userRole === 'hod' && userId && userDepartment) {
      if (viewMode === 'gatepasses') {
        fetchGatePasses();
      } else {
        fetchStudents();
      }
    }
  }, [userRole, userId, userDepartment, filter, viewMode, selectedYear]);

  // Reset selections when year filter changes
  useEffect(() => {
    setSelectedStudents(new Set());
  }, [selectedYear]);

  const checkUserRoleAndDepartment = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUnauthorized(true);
        setDebugInfo('No user found in authentication');
        router.push('/login');
        return;
      }

      setUserId(user.id);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, department, name, year')
        .eq('id', user.id)
        .single();

      if (error) {
        setDebugInfo(`Profile error: ${error.message}`);
        setUnauthorized(true);
        router.push('/login');
        return;
      }

      if (!profile || profile.role !== 'hod') {
        setDebugInfo(`User role is: ${profile?.role}, expected: hod`);
        setUnauthorized(true);
        router.push('/login');
        return;
      }

      setUserRole(profile.role);
      setUserDepartment(profile.department);
      setDebugInfo(`Authenticated as HOD: ${profile.name}, Department: ${profile.department}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDebugInfo(`Error: ${errorMessage}`);
      setUnauthorized(true);
      router.push('/login');
    }
  };

  const fetchGatePasses = async (): Promise<void> => {
    try {
      setLoading(true);

      // Try multiple query approaches to find what works
      let query = supabase
        .from('gatepasses')
        .select(`
          *,
          student:profiles!student_id (
            name,
            roll,
            department,
            year
          )
        `)
        .order('created_at', { ascending: false });

      // Approach 1: Filter by HOD's department through student relationship
      if (userDepartment) {
        query = query.eq('student.department', userDepartment);
      }

      const { data, error } = await query;

      if (error) {
        setDebugInfo(prev => prev + ` | Query error: ${error.message}`);
        
        // If the first approach fails, try a different approach
        await fetchGatePassesAlternative();
        return;
      }

      setGatePasses(data || []);
      setDebugInfo(prev => prev + ` | Found ${data?.length} passes for department ${userDepartment}`);
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      if (err.details) {
        setDebugInfo(prev => prev + ` | Details: ${err.details}`);
      }
      if (err.hint) {
        setDebugInfo(prev => prev + ` | Hint: ${err.hint}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGatePassesAlternative = async (): Promise<void> => {
    try {
      // Alternative approach: Get students first, then their gate passes
      const { data: departmentStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('department', userDepartment)
        .eq('role', 'student');

      if (studentsError) {
        return;
      }

      if (!departmentStudents || departmentStudents.length === 0) {
        setGatePasses([]);
        return;
      }

      const studentIds = departmentStudents.map(student => student.id);

      const { data: passes, error: passesError } = await supabase
        .from('gatepasses')
        .select(`
          *,
          student:profiles!student_id (
            name,
            roll,
            department,
            year
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (passesError) {
        return;
      }

      setGatePasses(passes || []);
      setDebugInfo(prev => prev + ` | Alternative approach found ${passes?.length} passes`);
      
    } catch (error) {
      // Silent catch for alternative approach
    }
  };

  const fetchStudents = async (): Promise<void> => {
    try {
      setStudentsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('department', userDepartment)
        .eq('role', 'student')
        .order('year', { ascending: false })
        .order('roll', { ascending: true });

      if (error) {
        setDebugInfo(prev => prev + ` | Students query error: ${error.message}`);
        throw error;
      }

      // Convert year from string to number for local state
      const studentsWithNumberYear = (data || []).map(student => ({
        ...student,
        year: parseInt(student.year || '1', 10) // Convert string to number, default to 1 if null
      }));

      setStudents(studentsWithNumberYear);
      setDebugInfo(prev => prev + ` | Found ${data?.length} students`);
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      if (err.details) {
        setDebugInfo(prev => prev + ` | Details: ${err.details}`);
      }
      if (err.hint) {
        setDebugInfo(prev => prev + ` | Hint: ${err.hint}`);
      }
    } finally {
      setStudentsLoading(false);
    }
  };

  // Search handler
  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  // Selection handlers
  const toggleStudentSelection = (studentId: string): void => {
    setSelectedStudents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(studentId)) {
        newSelection.delete(studentId);
      } else {
        newSelection.add(studentId);
      }
      return newSelection;
    });
  };

  const toggleSelectAll = (): void => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(student => student.id)));
    }
  };

  const isStudentSelected = (studentId: string): boolean => {
    return selectedStudents.has(studentId);
  };

  // Batch operations
  const handleBatchPromote = async (): Promise<void> => {
    if (selectedStudents.size === 0) {
      showNotification('Please select at least one student to promote.', 'warning');
      return;
    }

    try {
      setBatchOperationLoading(true);
      
      const selectedStudentData = filteredStudents.filter(student => 
        selectedStudents.has(student.id)
      );

      // Check if any student is already at maximum year
      const maxYearStudent = selectedStudentData.find(student => student.year >= 4);
      if (maxYearStudent) {
        showNotification(`Cannot promote: ${maxYearStudent.name} is already in Year 4.`, 'warning');
        return;
      }

      // Update all selected students
      const updates = Array.from(selectedStudents).map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (student && student.year < 4) {
          const newYear = student.year + 1;
          const newYearString = String(newYear);
          
          const { error } = await supabase
            .from('profiles')
            .update({ year: newYearString })
            .eq('id', studentId);

          if (error) throw error;

          return { studentId, newYear };
        }
        return null;
      });

      const results = await Promise.all(updates);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        const update = results.find(r => r?.studentId === student.id);
        if (update) {
          return { ...student, year: update.newYear };
        }
        return student;
      }));

      showNotification(`Successfully promoted ${selectedStudents.size} student(s)!`, 'success');
      setSelectedStudents(new Set());
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error promoting students: ' + err.message, 'error');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  const handleBatchDemote = async (): Promise<void> => {
    if (selectedStudents.size === 0) {
      showNotification('Please select at least one student to demote.', 'warning');
      return;
    }

    try {
      setBatchOperationLoading(true);
      
      const selectedStudentData = filteredStudents.filter(student => 
        selectedStudents.has(student.id)
      );

      // Check if any student is already at minimum year
      const minYearStudent = selectedStudentData.find(student => student.year <= 1);
      if (minYearStudent) {
        showNotification(`Cannot demote: ${minYearStudent.name} is already in Year 1.`, 'warning');
        return;
      }

      // Update all selected students
      const updates = Array.from(selectedStudents).map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (student && student.year > 1) {
          const newYear = student.year - 1;
          const newYearString = String(newYear);
          
          const { error } = await supabase
            .from('profiles')
            .update({ year: newYearString })
            .eq('id', studentId);

          if (error) throw error;

          return { studentId, newYear };
        }
        return null;
      });

      const results = await Promise.all(updates);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        const update = results.find(r => r?.studentId === student.id);
        if (update) {
          return { ...student, year: update.newYear };
        }
        return student;
      }));

      showNotification(`Successfully demoted ${selectedStudents.size} student(s)!`, 'warning');
      setSelectedStudents(new Set());
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error demoting students: ' + err.message, 'error');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  const handlePromoteFullBatch = async (year: number): Promise<void> => {
    const batchStudents = students.filter(student => student.year === year);
    
    if (batchStudents.length === 0) {
      showNotification(`No students found in Year ${year}.`, 'warning');
      return;
    }

    // Check if any student is already at maximum year
    const maxYearStudent = batchStudents.find(student => student.year >= 4);
    if (maxYearStudent) {
      showNotification(`Cannot promote batch: ${maxYearStudent.name} is already in Year 4.`, 'warning');
      return;
    }

    try {
      setBatchOperationLoading(true);
      
      // Update all students in the batch
      const updates = batchStudents.map(async (student) => {
        if (student.year < 4) {
          const newYear = student.year + 1;
          const newYearString = String(newYear);
          
          const { error } = await supabase
            .from('profiles')
            .update({ year: newYearString })
            .eq('id', student.id);

          if (error) throw error;

          return { studentId: student.id, newYear };
        }
        return null;
      });

      const results = await Promise.all(updates);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        const update = results.find(r => r?.studentId === student.id);
        if (update) {
          return { ...student, year: update.newYear };
        }
        return student;
      }));

      showNotification(`Successfully promoted entire Year ${year} batch (${batchStudents.length} students)!`, 'success');
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error promoting batch: ' + err.message, 'error');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  const handleDemoteFullBatch = async (year: number): Promise<void> => {
    const batchStudents = students.filter(student => student.year === year);
    
    if (batchStudents.length === 0) {
      showNotification(`No students found in Year ${year}.`, 'warning');
      return;
    }

    // Check if any student is already at minimum year
    const minYearStudent = batchStudents.find(student => student.year <= 1);
    if (minYearStudent) {
      showNotification(`Cannot demote batch: ${minYearStudent.name} is already in Year 1.`, 'warning');
      return;
    }

    try {
      setBatchOperationLoading(true);
      
      // Update all students in the batch
      const updates = batchStudents.map(async (student) => {
        if (student.year > 1) {
          const newYear = student.year - 1;
          const newYearString = String(newYear);
          
          const { error } = await supabase
            .from('profiles')
            .update({ year: newYearString })
            .eq('id', student.id);

          if (error) throw error;

          return { studentId: student.id, newYear };
        }
        return null;
      });

      const results = await Promise.all(updates);
      
      // Update local state
      setStudents(prev => prev.map(student => {
        const update = results.find(r => r?.studentId === student.id);
        if (update) {
          return { ...student, year: update.newYear };
        }
        return student;
      }));

      showNotification(`Successfully demoted entire Year ${year} batch (${batchStudents.length} students)!`, 'warning');
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error demoting batch: ' + err.message, 'error');
    } finally {
      setBatchOperationLoading(false);
    }
  };

  // Individual student operations (existing functions)
  const handlePromoteStudent = async (studentId: string, currentYear: number): Promise<void> => {
    try {
      setPromoteDemoteLoading(studentId);
      
      // Check if student is already at maximum year
      if (currentYear >= 4) {
        showNotification('Student is already in the final year (Year 4) and cannot be promoted further.', 'warning');
        return;
      }
      
      const newYear = currentYear + 1;
      
      // Convert to string since the database expects text
      const newYearString = String(newYear);
      
      const { error } = await supabase
        .from('profiles')
        .update({ year: newYearString })
        .eq('id', studentId);

      if (error) throw error;

      showNotification(`Student promoted to Year ${newYear} successfully!`, 'success');
      
      // Update local state - keep as number for local state
      setStudents(prev => prev.map(student => 
        student.id === studentId ? { ...student, year: newYear } : student
      ));
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      
      // Handle specific constraint violation
      if (err.message.includes('profiles_year_check')) {
        showNotification('Cannot promote student: Year value must be between 1 and 4.', 'error');
      } else {
        showNotification('Error promoting student: ' + err.message, 'error');
      }
    } finally {
      setPromoteDemoteLoading(null);
    }
  };

  const handleDemoteStudent = async (studentId: string, currentYear: number): Promise<void> => {
    try {
      setPromoteDemoteLoading(studentId);
      
      // Check if student is already at minimum year
      if (currentYear <= 1) {
        showNotification('Student is already in Year 1 and cannot be demoted further.', 'warning');
        return;
      }
      
      const newYear = currentYear - 1;
      
      // Convert to string since the database expects text
      const newYearString = String(newYear);
      
      const { error } = await supabase
        .from('profiles')
        .update({ year: newYearString })
        .eq('id', studentId);

      if (error) throw error;

      showNotification(`Student demoted to Year ${newYear} successfully!`, 'warning');
      
      // Update local state - keep as number for local state
      setStudents(prev => prev.map(student => 
        student.id === studentId ? { ...student, year: newYear } : student
      ));
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      
      // Handle specific constraint violation
      if (err.message.includes('profiles_year_check')) {
        showNotification('Cannot demote student: Year value must be between 1 and 4.', 'error');
      } else {
        showNotification('Error demoting student: ' + err.message, 'error');
      }
    } finally {
      setPromoteDemoteLoading(null);
    }
  };

  const exportToExcel = async (year: number | 'all' = 'all'): Promise<void> => {
    try {
      setExportLoading(year);
      
      // Filter students based on selected year
      const studentsToExport = year === 'all' 
        ? students 
        : students.filter(student => student.year === year);
      
      if (studentsToExport.length === 0) {
        showNotification('No students found to export', 'warning');
        return;
      }

      // Create CSV content
      const headers = ['Name', 'Roll Number', 'Year', 'Department', 'Student ID', 'Joined Date'];
      const csvContent = [
        headers.join(','),
        ...studentsToExport.map(student => [
          `"${student.name.replace(/"/g, '""')}"`,
          student.roll,
          student.year,
          `"${student.department}"`,
          student.id,
          new Date(student.created_at).toLocaleDateString()
        ].join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      const fileName = year === 'all' 
        ? `${userDepartment}_all_students.csv`
        : `${userDepartment}_batch_${year}_students.csv`;
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification(`Exported ${studentsToExport.length} students successfully!`, 'success');
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error exporting students: ' + err.message, 'error');
    } finally {
      setExportLoading(null);
    }
  };

  const _exportAllBatches = async (): Promise<void> => {
    try {
      setExportLoading('all');
      
      if (students.length === 0) {
        showNotification('No students found to export', 'warning');
        return;
      }

      // Group students by year
      const studentsByYear: { [key: number]: Student[] } = {};
      students.forEach(student => {
        if (!studentsByYear[student.year]) {
          studentsByYear[student.year] = [];
        }
        studentsByYear[student.year].push(student);
      });

      // Create CSV content with year sections
      const headers = ['Name', 'Roll Number', 'Year', 'Department', 'Student ID', 'Joined Date'];
      const csvRows = [];
      
      // Add header
      csvRows.push(headers.join(','));
      
      // Add all students
      students.forEach(student => {
        csvRows.push([
          `"${student.name.replace(/"/g, '""')}"`,
          student.roll,
          student.year,
          `"${student.department}"`,
          student.id,
          new Date(student.created_at).toLocaleDateString()
        ].join(','));
      });

      // Add summary section
      csvRows.push(''); // Empty line
      csvRows.push('SUMMARY');
      csvRows.push('Year,Total Students');
      Object.keys(studentsByYear).sort().forEach(year => {
        csvRows.push(`${year},${studentsByYear[parseInt(year)].length}`);
      });
      csvRows.push(`TOTAL,${students.length}`);

      const finalCsvContent = csvRows.join('\n');

      // Create blob and download
      const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${userDepartment}_all_batches_students.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification(`Exported all ${students.length} students successfully!`, 'success');
      
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error exporting students: ' + err.message, 'error');
    } finally {
      setExportLoading(null);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      setLogoutLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUserRole(null);
      setUserDepartment(null);
      setUserId(null);
      setGatePasses([]);
      setStudents([]);
      
      router.replace('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to logout. Please try again.');
    } finally {
      setLogoutLoading(false);
    }
  };

  const generateQRCode = async (passId: string, studentId: string): Promise<string> => {
    try {
      const qrData: QRCodeData = {
        passId,
        studentId,
        timestamp: new Date().toISOString(),
        department: userDepartment
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#2563eb',
          light: '#ffffff'
        }
      });

      const response = await fetch(qrCodeDataURL);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(`${passId}.png`, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(`${passId}.png`);

      return urlData.publicUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`QR code generation failed: ${errorMessage}`);
    }
  };

  const handleApprove = async (passId: string, studentId: string): Promise<void> => {
    try {
      setProcessing(passId);
      
      const qrUrl = await generateQRCode(passId, studentId);

      const { error } = await supabase
        .from('gatepasses')
        .update({
          status: 'approved',
          qr_url: qrUrl,
          hod_id: userId
        })
        .eq('id', passId);

      if (error) throw error;

      showNotification('Gate pass approved successfully! QR code generated.', 'success');
      fetchGatePasses();
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error approving gate pass: ' + err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (passId: string): Promise<void> => {
    try {
      setProcessing(passId);
      
      const { error } = await supabase
        .from('gatepasses')
        .update({ 
          status: 'rejected',
          qr_url: null,
          hod_id: userId
        })
        .eq('id', passId);

      if (error) throw error;

      showNotification('Gate pass rejected.', 'warning');
      fetchGatePasses();
    } catch (error: unknown) {
      const err = error as SupabaseError;
      showNotification('Error rejecting gate pass: ' + err.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info'): void => {
    // Using alert for simplicity, but you could replace this with a proper notification system
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const getStatusConfig = (status: string) => {
  const configs = {
    pending: { 
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: FiClock,
      label: 'Pending Review'
    },
    approved: { 
      color: 'bg-green-50 text-green-800 border-green-200',
      icon: FiCheckCircle,
      label: 'Approved'
    },
    rejected: { 
      color: 'bg-red-50 text-red-800 border-red-200',
      icon: FiXCircle,
      label: 'Rejected'
    },
    used: { 
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: FiCheckCircle, // or choose a different icon like FiCheckSquare
      label: 'Used'
    }
  };
  return configs[status as keyof typeof configs] || configs.pending;
};

  const downloadQRCode = async (qrUrl: string, studentName?: string): Promise<void> => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `gate-pass-${(studentName || 'unknown').replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      showNotification('Error downloading QR code', 'error');
    }
  };

  const filteredPasses = gatePasses.filter(pass => {
    if (filter === 'all') return true;
    return pass.status === filter;
  });

  const availableYears = Array.from(new Set(students.map(student => student.year).filter(year => year != null))).sort((a, b) => b - a);

  const filteredStudents = (selectedYear === 'all' 
    ? students 
    : students.filter(student => student.year === selectedYear)
  ).filter(student => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = student.name.toLowerCase().includes(query);
    const rollMatch = student.roll.toLowerCase().includes(query);
    
    return nameMatch || rollMatch;
  });

  if (loading && !userRole && !unauthorized) {
    return (
      <div className={`min-h-screen ${themeClasses.background} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={themeClasses.text.secondary}>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4 transition-colors duration-300`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl shadow-xl p-8 max-w-md w-full text-center ${themeClasses.card}`}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.text.primary}`}>Access Denied</h2>
          <p className={`mb-4 ${themeClasses.text.secondary}`}>
            {userRole === 'hod' 
              ? 'Redirecting to dashboard...' 
              : 'Please log in to access this page.'}
          </p>
          <div className={`p-3 rounded-lg mb-4 text-left ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm ${themeClasses.text.secondary}`}><strong>Debug Info:</strong> {debugInfo}</p>
            <p className={`text-sm ${themeClasses.text.secondary}`}><strong>Your Role:</strong> {userRole || 'Not set'}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push(userRole === 'hod' ? '/dashboard' : '/login')}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              {userRole === 'hod' ? 'Go to Dashboard' : 'Go to Login'}
            </button>
            <button
              onClick={checkUserRoleAndDepartment}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Retry Access Check
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading && !gatePasses.length && viewMode === 'gatepasses') {
    return (
      <div className={`min-h-screen ${themeClasses.background} p-4 md:p-8 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse mb-8">
            <div className={`h-8 rounded-lg w-1/3 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className={`h-4 rounded w-1/2 mb-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-32 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              ))}
            </div>
          </div>
          <div className="animate-pulse mb-8">
            <div className={`h-10 rounded-lg w-48 mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`h-40 rounded-2xl mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-colors duration-300`}>
      
      {/* Header from code 2 */}
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
                <p className={`text-xs ${themeClasses.text.muted}`}>Staff Locator System</p>
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

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FiAward className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-3xl md:text-4xl font-bold ${themeClasses.text.primary}`}>
                      {viewMode === 'gatepasses' ? 'Gate Pass Requests' : 'Department Students'}
                    </h1>
                    <p className={`text-lg ${themeClasses.text.secondary}`}>
                      {userDepartment ? `${userDepartment.toUpperCase()} Department - HOD Portal` : 'HOD Portal'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <div className="text-right">
                  <p className={`text-sm ${themeClasses.text.secondary}`}>
                    {viewMode === 'gatepasses' ? 'Assigned Requests' : 'Total Students'}
                  </p>
                  <p className={`font-semibold ${themeClasses.text.primary}`}>
                    {viewMode === 'gatepasses' ? gatePasses.length : students.length} total
                  </p>
                </div>
                <button
                  onClick={viewMode === 'gatepasses' ? fetchGatePasses : fetchStudents}
                  disabled={loading || studentsLoading}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${themeClasses.button.secondary}`}
                >
                  <FiRefreshCw className={`w-4 h-4 ${(loading || studentsLoading) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <FiLogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">
                    {logoutLoading ? 'Logging out...' : 'Logout'}
                  </span>
                  <span className="sm:hidden">
                    {logoutLoading ? '...' : 'Logout'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setViewMode('gatepasses')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'gatepasses'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : `${themeClasses.button.secondary}`
                }`}
              >
                <FiList className="w-4 h-4" />
                <span>Gate Pass Requests</span>
              </button>
              <button
                onClick={() => setViewMode('students')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  viewMode === 'students'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : `${themeClasses.button.secondary}`
                }`}
              >
                <FiUsers className="w-4 h-4" />
                <span>View Students</span>
              </button>
            </div>

            {viewMode === 'gatepasses' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { status: 'pending', count: gatePasses.filter(p => p.status === 'pending').length },
                  { status: 'approved', count: gatePasses.filter(p => p.status === 'approved').length },
                  { status: 'rejected', count: gatePasses.filter(p => p.status === 'rejected').length }
                ].map((stat, index) => {
                  const config = getStatusConfig(stat.status);
                  const Icon = config.icon;
                  
                  return (
                    <motion.div
                      key={stat.status}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${themeClasses.card}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>{config.label}</p>
                          <p className={`text-3xl font-bold mt-2 ${themeClasses.text.primary}`}>{stat.count}</p>
                          <p className={`text-xs mt-1 ${themeClasses.text.muted}`}>Assigned to you</p>
                        </div>
                        <div className={`p-3 rounded-xl ${config.color.replace('bg-', 'bg-').split(' ')[0]}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {viewMode === 'students' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${themeClasses.card}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Total Students</p>
                      <p className={`text-3xl font-bold mt-2 ${themeClasses.text.primary}`}>{students.length}</p>
                      <p className={`text-xs mt-1 ${themeClasses.text.muted}`}>All Years</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                      <FiUsers className="w-6 h-6" />
                    </div>
                  </div>
                  <button
                    onClick={() => exportToExcel('all')}
                    disabled={exportLoading !== null || students.length === 0}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm mt-4"
                  >
                    {exportLoading === 'all' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiDownload className="w-4 h-4" />
                    )}
                    <span>Export All</span>
                  </button>
                </motion.div>
                
                {availableYears.map((year, index) => {
                  const batchStudents = students.filter(s => s.year === year);
                  return (
                    <motion.div
                      key={year}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.1 }}
                      className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${themeClasses.card}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${themeClasses.text.secondary}`}>Year {year}</p>
                          <p className={`text-3xl font-bold mt-2 ${themeClasses.text.primary}`}>
                            {batchStudents.length}
                          </p>
                          <p className={`text-xs mt-1 ${themeClasses.text.muted}`}>Students</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-100 text-green-600">
                          <FiUser className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 mt-4">
                        <button
                          onClick={() => exportToExcel(year)}
                          disabled={exportLoading !== null || batchStudents.length === 0}
                          className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                        >
                          {exportLoading === year ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiDownload className="w-4 h-4" />
                          )}
                          <span>Export Batch</span>
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePromoteFullBatch(year)}
                            disabled={batchOperationLoading || batchStudents.length === 0 || year >= 4}
                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-xs"
                            title="Promote entire batch"
                          >
                            <FiArrowUp className="w-3 h-3" />
                            <span>Promote</span>
                          </button>
                          <button
                            onClick={() => handleDemoteFullBatch(year)}
                            disabled={batchOperationLoading || batchStudents.length === 0 || year <= 1}
                            className="flex-1 flex items-center justify-center space-x-1 bg-orange-600 text-white py-2 px-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-xs"
                            title="Demote entire batch"
                          >
                            <FiArrowDown className="w-3 h-3" />
                            <span>Demote</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {viewMode === 'gatepasses' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex flex-wrap gap-3 items-center">
                <div className={`flex items-center space-x-2 mr-4 ${themeClasses.text.secondary}`}>
                  <FiFilter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter by status:</span>
                </div>
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                      filter === filterType
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : `${themeClasses.button.secondary}`
                    }`}
                  >
                    <span>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</span>
                    {filterType !== 'all' && (
                      <span className="px-2 py-1 text-xs bg-white/20 rounded-full">
                        {gatePasses.filter(p => p.status === filterType).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'students' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Year filter buttons */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className={`flex items-center space-x-2 mr-4 ${themeClasses.text.secondary}`}>
                      <FiFilter className="w-4 h-4" />
                      <span className="text-sm font-medium">Filter by year:</span>
                    </div>
                    <button
                      onClick={() => setSelectedYear('all')}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                        selectedYear === 'all'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : `${themeClasses.button.secondary}`
                      }`}
                    >
                      <span>All Years</span>
                      <span className="px-2 py-1 text-xs bg-white/20 rounded-full">
                        {students.length}
                      </span>
                    </button>
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                          selectedYear === year
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : `${themeClasses.button.secondary}`
                        }`}
                      >
                        <span>Year {year}</span>
                        <span className="px-2 py-1 text-xs bg-white/20 rounded-full">
                          {students.filter(s => s.year === year).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 focus-within:border-blue-500' 
                        : 'bg-white border-gray-300 focus-within:border-blue-500'
                    }`}>
                      <FiSearch className={`w-4 h-4 ${themeClasses.text.muted}`} />
                      <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className={`bg-transparent border-none focus:outline-none focus:ring-0 w-64 ${
                          darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => handleSearch('')}
                          className={`p-1 rounded-full hover:bg-opacity-20 transition-colors ${
                            darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch Operation Buttons */}
                {selectedStudents.size > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleBatchPromote}
                      disabled={batchOperationLoading}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {batchOperationLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiArrowUp className="w-4 h-4" />
                      )}
                      <span>Promote Selected ({selectedStudents.size})</span>
                    </button>
                    <button
                      onClick={handleBatchDemote}
                      disabled={batchOperationLoading}
                      className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {batchOperationLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiArrowDown className="w-4 h-4" />
                      )}
                      <span>Demote Selected ({selectedStudents.size})</span>
                    </button>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* Export Current View Button */}
                  <button
                    onClick={() => exportToExcel(selectedYear)}
                    disabled={exportLoading !== null || filteredStudents.length === 0}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {exportLoading === selectedYear ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiFileText className="w-4 h-4" />
                    )}
                    <span>
                      {selectedYear === 'all' 
                        ? `Export All (${filteredStudents.length})`
                        : `Export Batch ${selectedYear} (${filteredStudents.length})`
                      }
                    </span>
                  </button>
                </div>
              </div>

              {/* Search Results Info */}
              {searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg mb-4 ${
                    darkMode ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiSearch className="w-4 h-4 text-blue-600" />
                      <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                        Showing {filteredStudents.length} result(s) for "{searchQuery}"
                      </span>
                    </div>
                    <button
                      onClick={() => handleSearch('')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear Search
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Selection Info */}
              {selectedStudents.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg mb-4 ${
                    darkMode ? 'bg-blue-900 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiUsers className="w-5 h-5 text-blue-600" />
                      <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                        {selectedStudents.size} student(s) selected
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedStudents(new Set())}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear Selection
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl shadow-sm border overflow-hidden ${themeClasses.card}`}
          >
            <AnimatePresence mode="wait">
              {viewMode === 'gatepasses' ? (
                filteredPasses.length === 0 ? (
                  <motion.div
                    key="empty-gatepasses"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiMessageSquare className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
                      No gate pass requests found
                    </h3>
                    <p className={`max-w-sm mx-auto mb-4 ${themeClasses.text.secondary}`}>
                      {gatePasses.length === 0 
                        ? "No gate pass requests found for your department. Check the debug panel above for details."
                        : "No gate passes match the current filter."
                      }
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={fetchGatePasses}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Check Again
                      </button>
                      <button
                        onClick={() => setFilter('all')}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ml-2"
                      >
                        Show All
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.ul
                    key="gatepass-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="divide-y divide-gray-200"
                  >
                    {filteredPasses.map((pass, index) => {
                      const statusConfig = getStatusConfig(pass.status);
                      const StatusIcon = statusConfig.icon;
                      const student = pass.student;
                      
                      return (
                        <motion.li
                          key={pass.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                      <FiUser className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                                        {student?.name || 'Unknown Student'}
                                      </h3>
                                      <p className={`text-sm ${themeClasses.text.secondary}`}>
                                        Roll No: {student?.roll || 'N/A'} | Year: {student?.year || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{statusConfig.label}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                  <div className={`flex items-center space-x-2 ${themeClasses.text.secondary}`}>
                                    <FiBook className="w-4 h-4" />
                                    <span className="text-sm">Roll: <strong className={themeClasses.text.primary}>{student?.roll || 'N/A'}</strong></span>
                                  </div>
                                  <div className={`flex items-center space-x-2 ${themeClasses.text.secondary}`}>
                                    <FiBook className="w-4 h-4" />
                                    <span className="text-sm">Year: <strong className={themeClasses.text.primary}>{student?.year || 'N/A'}</strong></span>
                                  </div>
                                  <div className={`flex items-center space-x-2 ${themeClasses.text.secondary}`}>
                                    <FiCalendar className="w-4 h-4" />
                                    <span className="text-sm">Date: <strong className={themeClasses.text.primary}>{new Date(pass.date).toLocaleDateString()}</strong></span>
                                  </div>
                                  <div className={`flex items-center space-x-2 ${themeClasses.text.secondary}`}>
                                    <FiHash className="w-4 h-4" />
                                    <span className="text-sm">ID: <strong className={`font-mono text-xs ${themeClasses.text.primary}`}>{pass.id}</strong></span>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className={`text-sm font-medium mb-2 ${themeClasses.text.secondary}`}>Reason for Request:</p>
                                  <p className={`rounded-lg p-3 border ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}>{pass.reason}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                  <span>Submitted: {new Date(pass.created_at).toLocaleString()}</span>
                                </div>

                                {pass.qr_url && (
                                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2 text-green-800">
                                        <FiCheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">QR Code Generated</span>
                                      </div>
                                      <button
                                        onClick={() => downloadQRCode(pass.qr_url!, student?.name)}
                                        className="flex items-center space-x-1 text-green-700 hover:text-green-800 text-sm font-medium px-3 py-1 rounded-lg bg-green-100 hover:bg-green-200 transition-colors"
                                      >
                                        <FiDownload className="w-3 h-3" />
                                        <span>Download</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col space-y-3 min-w-[140px]">
                                {pass.status === 'pending' && (
                                  <>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => handleApprove(pass.id, pass.student_id)}
                                      disabled={processing === pass.id}
                                      className="bg-green-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-500/25"
                                    >
                                      {processing === pass.id ? (
                                        <div className="flex items-center justify-center space-x-2">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Approving...</span>
                                        </div>
                                      ) : (
                                        'Approve Request'
                                      )}
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => handleReject(pass.id)}
                                      disabled={processing === pass.id}
                                      className="bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {processing === pass.id ? 'Rejecting...' : 'Reject Request'}
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </motion.ul>
                )
              ) : (
                filteredStudents.length === 0 ? (
                  <motion.div
                    key="empty-students"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiUsers className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${themeClasses.text.primary}`}>
                      No students found
                    </h3>
                    <p className={`max-w-sm mx-auto mb-4 ${themeClasses.text.secondary}`}>
                      {studentsLoading 
                        ? "Loading students..."
                        : searchQuery
                          ? `No students found matching "${searchQuery}"`
                          : "No students found in your department."
                      }
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={fetchStudents}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {studentsLoading ? 'Loading...' : 'Refresh Students'}
                      </button>
                      {searchQuery && (
                        <button
                          onClick={() => handleSearch('')}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors ml-2"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="students-list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="divide-y divide-gray-200"
                  >
                    {/* Selection Header */}
                    <div className={`p-4 border-b ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={toggleSelectAll}
                          className="flex items-center space-x-3 text-sm font-medium"
                        >
                          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                            selectedStudents.size === filteredStudents.length
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : darkMode
                                ? 'border-gray-500 text-transparent'
                                : 'border-gray-400 text-transparent'
                          }`}>
                            {selectedStudents.size === filteredStudents.length && (
                              <FiCheck className="w-3 h-3" />
                            )}
                          </div>
                          <span className={themeClasses.text.secondary}>
                            {selectedStudents.size === filteredStudents.length
                              ? 'Deselect All'
                              : 'Select All'
                            }
                          </span>
                        </button>
                        <span className={`text-sm ${themeClasses.text.muted}`}>
                          {selectedStudents.size} of {filteredStudents.length} selected
                        </span>
                      </div>
                    </div>

                    {filteredStudents.map((student, index) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`hover:bg-gray-50 transition-colors duration-200 p-6 ${
                          isStudentSelected(student.id) 
                            ? darkMode 
                              ? 'bg-blue-900/20' 
                              : 'bg-blue-50'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => toggleStudentSelection(student.id)}
                              className="flex-shrink-0"
                            >
                              <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                                isStudentSelected(student.id)
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : darkMode
                                    ? 'border-gray-500 text-transparent'
                                    : 'border-gray-400 text-transparent'
                              }`}>
                                {isStudentSelected(student.id) && (
                                  <FiCheck className="w-3 h-3" />
                                )}
                              </div>
                            </button>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <FiUser className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
                                {student.name}
                              </h3>
                              <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <FiBook className="w-4 h-4" />
                                  <span>Roll: <strong>{student.roll}</strong></span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <FiCalendar className="w-4 h-4" />
                                  <span>Year: <strong>{student.year}</strong></span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <FiHash className="w-4 h-4" />
                                  <span>ID: <strong className="font-mono text-xs">{student.id}</strong></span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right mr-4">
                              <div className={`text-sm ${themeClasses.text.muted}`}>
                                Joined: {new Date(student.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-lg font-bold text-blue-600">
                                Year {student.year}
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePromoteStudent(student.id, student.year)}
                                disabled={promoteDemoteLoading === student.id}
                                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                title="Promote to next year"
                              >
                                {promoteDemoteLoading === student.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiArrowUp className="w-4 h-4" />
                                )}
                                <span>Promote</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDemoteStudent(student.id, student.year)}
                                disabled={promoteDemoteLoading === student.id || student.year <= 1}
                                className="flex items-center space-x-2 bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
                                title="Demote to previous year"
                              >
                                {promoteDemoteLoading === student.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <FiArrowDown className="w-4 h-4" />
                                )}
                                <span>Demote</span>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Footer from code 2 */}
      <footer className={`border-t ${
        darkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
      } transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                © 2025 Cabin Khojo
              </p>
            </div>
            <div>
              <p className={`text-sm ${themeClasses.text.muted}`}>
                Institutional Staff Management
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}