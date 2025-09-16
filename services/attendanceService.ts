import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/firebase';
import { AttendanceSession, AttendanceRecord, Student } from '@/types/attendance';

// Generate unique QR code data
const generateQRData = (sessionId: string, classId: string): string => {
  const timestamp = Date.now();
  return JSON.stringify({
    sessionId,
    classId,
    timestamp,
    type: 'attendance'
  });
};

// Create new attendance session
// Create new attendance session
export const createAttendanceSession = async (
  classId: string,
  teacherId: string
): Promise<AttendanceSession> => {
  try {
    const students = await getStudentsByClass(classId); // get enrolled students
    const studentIds = students.map(s => s.id);

    const now = Timestamp.now();
    const sessionData = {
      classId,
      teacherId,
      studentIds, // ✅ keep enrolled student ids snapshot
      date: new Date().toISOString().split('T')[0],
      startTime: now,
      status: 'active' as const,
      qrCode: '',
      qrExpiry: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'attendanceSessions'), sessionData);

    const qrData = JSON.stringify({
      sessionId: docRef.id,
      classId,
      type: 'attendance',
      timestamp: Date.now(),
    });

    await updateDoc(docRef, { qrCode: qrData });

    return { id: docRef.id, ...sessionData, qrCode: qrData };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};


// Get active session for a class
export const getActiveSession = async (classId: string): Promise<AttendanceSession | null> => {
  try {
    const q = query(
      collection(db, 'attendanceSessions'),
      where('classId', '==', classId),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AttendanceSession;
  } catch (error) {
    console.error('Error getting active session:', error);
    throw error;
  }
};

// End attendance session
export const endAttendanceSession = async (sessionId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'attendanceSessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'completed',
      endTime: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error ending attendance session:', error);
    throw error;
  }
};

// Get students enrolled in a class
export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
  try {
    // This assumes you have a students collection with classId reference
    // Adjust the query based on your actual data structure
    const q = query(
      collection(db, 'students'),
      where('classIds', 'array-contains', classId),
      where('status', '==', 'active'),
      orderBy('name')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
};

// Mark attendance manually
export const markAttendanceManually = async (
  sessionId: string,
  studentId: string,
  status: 'present' | 'absent' | 'late'
): Promise<void> => {
  try {
    // Check if attendance record already exists
    const existingRecordQuery = query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    );
    
    const existingRecordSnapshot = await getDocs(existingRecordQuery);
    
    const recordData = {
      sessionId,
      studentId,
      status,
      markedAt: Timestamp.now(),
      markedBy: 'manual' as const,
      updatedAt: Timestamp.now()
    };
    
    if (existingRecordSnapshot.empty) {
      // Create new record
      await addDoc(collection(db, 'attendanceRecords'), {
        ...recordData,
        createdAt: Timestamp.now()
      });
    } else {
      // Update existing record
      const recordRef = existingRecordSnapshot.docs[0].ref;
      await updateDoc(recordRef, recordData);
    }
  } catch (error) {
    console.error('Error marking attendance manually:', error);
    throw error;
  }
};

// Mark attendance via QR scan
export const markAttendanceByQR = async (
  qrData: string,
  studentId: string,
  location?: { latitude: number; longitude: number }
): Promise<void> => {
  try {
    const parsedData = JSON.parse(qrData);
    const { sessionId, classId } = parsedData;

    // get session
    const sessionSnap = await getDoc(doc(db, 'attendanceSessions', sessionId));
    if (!sessionSnap.exists()) throw new Error('Invalid session');

    const session = sessionSnap.data() as AttendanceSession;

    // check status + expiry
    if (session.status !== 'active') throw new Error('Session not active');
    if (session.qrExpiry.toDate() < new Date()) throw new Error('QR code expired');

    // check student is in session.studentIds
    if (!session.studentIds?.includes(studentId)) {
      throw new Error('not enrolled'); // ✅ important
    }

    // check if already marked
    const q = query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      where('studentId', '==', studentId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error('already marked');

    // mark attendance
    await addDoc(collection(db, 'attendanceRecords'), {
      sessionId,
      classId,
      studentId,
      status: 'present',
      markedAt: Timestamp.now(),
      markedBy: 'qr',
      location: location ? `${location.latitude},${location.longitude}` : undefined,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (err) {
    console.error('Error marking attendance:', err);
    throw err;
  }
};


// Get attendance records for a session
export const getAttendanceRecords = async (sessionId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'attendanceRecords'),
      where('sessionId', '==', sessionId),
      orderBy('markedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting attendance records:', error);
    throw error;
  }
};

// Get attendance history for a class
export const getAttendanceHistory = async (
  classId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceSession[]> => {
  try {
    let q = query(
      collection(db, 'attendanceSessions'),
      where('classId', '==', classId),
      orderBy('startTime', 'desc')
    );
    
    if (startDate && endDate) {
      // Add date filtering if needed
      // This would require additional date field handling
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceSession[];
  } catch (error) {
    console.error('Error getting attendance history:', error);
    throw error;
  }
};

// Get attendance statistics for a class
export const getAttendanceStatistics = async (classId: string, dateRange?: {
  start: string;
  end: string;
}): Promise<{
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}> => {
  try {
    // Get all sessions for the class
    const sessions = await getAttendanceHistory(classId);
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalStudents: 0,
        averageAttendance: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0
      };
    }
    
    // Get all attendance records for these sessions
    const sessionIds = sessions.map(s => s.id);
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    
    for (const sessionId of sessionIds) {
      const records = await getAttendanceRecords(sessionId);
      records.forEach(record => {
        switch (record.status) {
          case 'present':
            totalPresent++;
            break;
          case 'absent':
            totalAbsent++;
            break;
          case 'late':
            totalLate++;
            break;
        }
      });
    }
    
    const students = await getStudentsByClass(classId);
    const totalRecords = totalPresent + totalAbsent + totalLate;
    const averageAttendance = totalRecords > 0 ? (totalPresent + totalLate) / totalRecords * 100 : 0;
    
    return {
      totalSessions: sessions.length,
      totalStudents: students.length,
      averageAttendance: Math.round(averageAttendance),
      presentCount: totalPresent,
      absentCount: totalAbsent,
      lateCount: totalLate
    };
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    throw error;
  }
};

// Real-time listener for attendance records
export const subscribeToAttendanceRecords = (
  sessionId: string,
  callback: (records: AttendanceRecord[]) => void
) => {
  const q = query(
    collection(db, 'attendanceRecords'),
    where('sessionId', '==', sessionId),
    orderBy('markedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AttendanceRecord[];
    callback(records);
  });
};

// Refresh QR code (generate new one with updated expiry)
export const refreshQRCode = async (sessionId: string): Promise<string> => {
  try {
    const sessionRef = doc(db, 'attendanceSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }
    
    const session = sessionDoc.data();
    const newQRData = generateQRData(sessionId, session.classId);
    const newExpiry = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes
    
    await updateDoc(sessionRef, {
      qrCode: newQRData,
      qrExpiry: newExpiry,
      updatedAt: Timestamp.now()
    });
    
    return newQRData;
  } catch (error) {
    console.error('Error refreshing QR code:', error);
    throw error;
  }
};

// Bulk mark absent for students who haven't marked attendance
export const markAbsentStudents = async (sessionId: string): Promise<void> => {
  try {
    // Get session details
    const sessionDoc = await getDoc(doc(db, 'attendanceSessions', sessionId));
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }
    
    const session = sessionDoc.data() as AttendanceSession;
    
    // Get all students in the class
    const students = await getStudentsByClass(session.classId);
    
    // Get existing attendance records
    const existingRecords = await getAttendanceRecords(sessionId);
    const markedStudentIds = existingRecords.map(record => record.studentId);
    
    // Find students who haven't marked attendance
    const unmarkedStudents = students.filter(student => 
      !markedStudentIds.includes(student.id)
    );
    
    // Batch mark them as absent
    if (unmarkedStudents.length > 0) {
      const batch = writeBatch(db);
      
      unmarkedStudents.forEach(student => {
        const recordRef = doc(collection(db, 'attendanceRecords'));
        batch.set(recordRef, {
          sessionId,
          studentId: student.id,
          status: 'absent',
          markedAt: Timestamp.now(),
          markedBy: 'auto',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error('Error marking absent students:', error);
    throw error;
  }
};