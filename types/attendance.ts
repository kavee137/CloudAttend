import { Timestamp } from 'firebase/firestore';

export interface AttendanceSession {
  id: string;
  classId: string;
  teacherId: string;
  date: string; // YYYY-MM-DD format
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'active' | 'completed' | 'cancelled';
  qrCode: string;
  qrExpiry: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  markedAt?: Timestamp;
  markedBy: 'qr' | 'manual' | 'auto';
  location?: string; // GPS coordinates if available (format: "lat,lng")
  notes?: string; // Optional notes about the attendance
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string; // Student ID number/roll number
  classIds: string[]; // Array of class IDs student is enrolled in
  status: 'active' | 'inactive' | 'suspended';
  profileImage?: string;
  phoneNumber?: string;
  parentContact?: {
    name: string;
    email?: string;
    phone?: string;
    relationship: 'mother' | 'father' | 'guardian';
  };
  enrollmentDate: Timestamp;
  dateOfBirth?: Timestamp;
  address?: string;
  emergencyContact?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QRData {
  sessionId: string;
  classId: string;
  timestamp: number;
  type: 'attendance';
  version?: string; // For future QR format versions
}

export interface AttendanceStatistics {
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number; // Percentage
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number; // Overall attendance rate
  trends: AttendanceTrend[];
}

export interface AttendanceTrend {
  date: string;
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalStudents: number;
}

export interface SessionSummary {
  session: AttendanceSession;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  unmarkedCount: number;
  attendanceRate: number;
  records: AttendanceRecordWithStudent[];
}

export interface AttendanceRecordWithStudent extends AttendanceRecord {
  student: Student;
}

// For filtering attendance history
export interface AttendanceFilter {
  startDate?: string;
  endDate?: string;
  status?: 'all' | 'present' | 'absent' | 'late' | 'unmarked';
  studentId?: string;
  sessionStatus?: 'all' | 'active' | 'completed' | 'cancelled';
  markedBy?: 'all' | 'qr' | 'manual' | 'auto';
}

// For attendance reports
export interface AttendanceReport {
  classId: string;
  className: string;
  teacherName: string;
  dateRange: {
    start: string;
    end: string;
  };
  statistics: AttendanceStatistics;
  sessions: SessionSummary[];
  studentSummaries: StudentAttendanceSummary[];
  generatedAt: Timestamp;
  generatedBy: string; // User ID who generated the report
}

export interface StudentAttendanceSummary {
  student: Student;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  lastAttendance?: {
    date: string;
    status: 'present' | 'absent' | 'late';
    sessionId: string;
  };
  streaks: {
    currentPresentStreak: number;
    longestPresentStreak: number;
    currentAbsentStreak: number;
    longestAbsentStreak: number;
  };
}

// For real-time session updates
export interface SessionUpdate {
  type: 'student_marked' | 'session_ended' | 'qr_refreshed' | 'session_started';
  sessionId: string;
  data?: any;
  timestamp: Timestamp;
}

// For attendance notifications
export interface AttendanceNotification {
  id: string;
  type: 'session_started' | 'session_ending' | 'low_attendance' | 'perfect_attendance';
  title: string;
  message: string;
  classId: string;
  sessionId?: string;
  studentId?: string;
  read: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// For attendance settings/preferences
export interface AttendanceSettings {
  id: string;
  classId: string;
  teacherId: string;
  qrExpiryMinutes: number; // Default: 10 minutes
  lateThresholdMinutes: number; // Default: 15 minutes
  autoMarkAbsentAfterMinutes: number; // Default: 30 minutes
  allowManualMarking: boolean;
  requireLocation: boolean;
  locationRadius: number; // In meters for geofencing
  allowLateMarking: boolean;
  notifications: {
    sessionReminders: boolean;
    lowAttendanceAlerts: boolean;
    sessionEndReminders: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// For bulk attendance operations
export interface BulkAttendanceOperation {
  sessionId: string;
  operation: 'mark_all_present' | 'mark_all_absent' | 'mark_unmarked_absent';
  studentIds?: string[];
  performedBy: string;
  timestamp: Timestamp;
  results: {
    successful: number;
    failed: number;
    errors: string[];
  };
}

// For attendance analytics/dashboard
export interface AttendanceAnalytics {
  classId: string;
  period: {
    start: string;
    end: string;
  };
  overview: {
    totalSessions: number;
    averageAttendance: number;
    bestAttendanceDay: string;
    worstAttendanceDay: string;
    mostActiveStudent: string;
    leastActiveStudent: string;
  };
  weeklyTrends: {
    week: string;
    attendanceRate: number;
    sessions: number;
  }[];
  studentPerformance: {
    excellent: number; // >95% attendance
    good: number; // 85-95%
    average: number; // 70-85%
    poor: number; // <70%
  };
  timeAnalysis: {
    peakAttendanceHour: number;
    averageSessionDuration: number;
    mostCommonLateTime: number;
  };
}

// For exporting attendance data
export interface AttendanceExport {
  format: 'csv' | 'pdf' | 'xlsx';
  classId: string;
  dateRange: {
    start: string;
    end: string;
  };
  includeFields: {
    studentInfo: boolean;
    sessionDetails: boolean;
    statistics: boolean;
    notes: boolean;
  };
  groupBy: 'student' | 'session' | 'date';
  generatedAt: Timestamp;
  fileUrl?: string;
}

// For attendance validation
export interface AttendanceValidation {
  sessionId: string;
  studentId: string;
  isValid: boolean;
  reasons: string[];
  location?: {
    provided: string;
    expected: string;
    distance: number;
  };
  timestamp: Timestamp;
}

// Utility types
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unmarked';
export type SessionStatus = 'active' | 'completed' | 'cancelled';
export type StudentStatus = 'active' | 'inactive' | 'suspended';
export type MarkingMethod = 'qr' | 'manual' | 'auto';

// For component props
export interface AttendanceSessionProps {
  classId: string;
  teacherId: string;
}

export interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: string) => void;
}

export interface StudentListProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  sessionActive: boolean;
  onMarkAttendance: (studentId: string, status: AttendanceStatus) => void;
}

export interface AttendanceHistoryProps {
  classId: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Error types
export interface AttendanceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Timestamp;
}

export const ATTENDANCE_ERRORS = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  STUDENT_NOT_ENROLLED: 'STUDENT_NOT_ENROLLED',
  ALREADY_MARKED: 'ALREADY_MARKED',
  QR_EXPIRED: 'QR_EXPIRED',
  INVALID_QR: 'INVALID_QR',
  LOCATION_REQUIRED: 'LOCATION_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;