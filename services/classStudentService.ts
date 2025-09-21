import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  orderBy
} from "firebase/firestore";
import { db } from "@/firebase";

// Interface for class-student relationship
export interface ClassStudent {
  id?: string;
  classId: string;
  studentId: string;
  instituteId: string;
  status: 'active' | 'inactive';
  assignedAt: Date;
  assignedBy: string; // teacher or admin user ID
}

// Reference to class-students collection
export const classStudentsRef = collection(db, "classStudents");

// Assign student to class
export const assignStudentToClass = async (
  classId: string,
  studentId: string,
  instituteId: string,
  assignedBy: string
) => {
  try {
    // Check if student is already assigned to this class
    const existingQuery = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("studentId", "==", studentId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      // If exists but inactive, reactivate
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.status === 'inactive') {
        await updateDoc(doc(db, "classStudents", existingDoc.id), {
          status: 'active',
          assignedAt: new Date(),
          assignedBy
        });
        return { success: true, message: "Student re-assigned to class successfully" };
      } else {
        return { success: false, error: "Student is already assigned to this class" };
      }
    }

    // Create new assignment
    const classStudentData: ClassStudent = {
      classId,
      studentId,
      instituteId,
      status: 'active',
      assignedAt: new Date(),
      assignedBy
    };

    const docRef = await addDoc(classStudentsRef, classStudentData);
    console.log("Student assigned to class with ID:", docRef.id);

    return { success: true, assignmentId: docRef.id };
  } catch (error) {
    console.error("Error assigning student to class:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

// Remove student from class (set to inactive)
export const removeStudentFromClass = async (classId: string, studentId: string) => {
  try {
    const q = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("studentId", "==", studentId),
      where("status", "==", "active")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: "Student assignment not found" };
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((document) => {
      batch.update(doc(db, "classStudents", document.id), {
        status: 'inactive'
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error removing student from class:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

// Get all students in a class
export const getStudentsByClass = async (classId: string) => {
  try {
    const q = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("status", "==", "active")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as ClassStudent[];
  } catch (error) {
    console.error("Error fetching students by class:", error);
    throw error;
  }
};

// Get all classes for a student
export const getClassesByStudent = async (studentId: string) => {
  try {
    const q = query(
      classStudentsRef,
      where("studentId", "==", studentId),
      where("status", "==", "active")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as ClassStudent[];
  } catch (error) {
    console.error("Error fetching classes by student:", error);
    throw error;
  }
};

// Get unassigned students for a class (students not in this class but in same institute)
export const getUnassignedStudentsForClass = async (classId: string, instituteId: string) => {
  try {
    // Get all active students in institute
    const studentsQuery = query(
      collection(db, "students"),
      where("instituteId", "==", instituteId),
      where("status", "==", "active")
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const allStudents = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get students already assigned to this class
    const assignedQuery = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("status", "==", "active")
    );
    const assignedSnapshot = await getDocs(assignedQuery);
    const assignedStudentIds = assignedSnapshot.docs.map(doc => doc.data().studentId);

    // Filter out assigned students
    const unassignedStudents = allStudents.filter(
      student => !assignedStudentIds.includes(student.id)
    );

    return unassignedStudents;
  } catch (error) {
    console.error("Error fetching unassigned students:", error);
    throw error;
  }
};

// Bulk assign students to class
export const bulkAssignStudentsToClass = async (
  classId: string,
  studentIds: string[],
  instituteId: string,
  assignedBy: string
) => {
  try {
    const batch = writeBatch(db);
    const assignments = [];

    for (const studentId of studentIds) {
      // Check if already assigned
      const existingQuery = query(
        classStudentsRef,
        where("classId", "==", classId),
        where("studentId", "==", studentId)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.empty) {
        // Create new assignment
        const newDocRef = doc(classStudentsRef);
        const classStudentData: ClassStudent = {
          classId,
          studentId,
          instituteId,
          status: 'active',
          assignedAt: new Date(),
          assignedBy
        };
        
        batch.set(newDocRef, classStudentData);
        assignments.push({ studentId, assignmentId: newDocRef.id });
      }
    }

    if (assignments.length > 0) {
      await batch.commit();
      return { success: true, assignments, count: assignments.length };
    } else {
      return { success: false, error: "All students are already assigned to this class" };
    }
  } catch (error) {
    console.error("Error bulk assigning students:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
};

// Get class assignment statistics
export const getClassStudentStats = async (classId: string) => {
  try {
    const activeQuery = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("status", "==", "active")
    );
    
    const inactiveQuery = query(
      classStudentsRef,
      where("classId", "==", classId),
      where("status", "==", "inactive")
    );

    const [activeSnapshot, inactiveSnapshot] = await Promise.all([
      getDocs(activeQuery),
      getDocs(inactiveQuery)
    ]);

    return {
      activeStudents: activeSnapshot.size,
      removedStudents: inactiveSnapshot.size,
      totalAssignments: activeSnapshot.size + inactiveSnapshot.size
    };
  } catch (error) {
    console.error("Error fetching class student stats:", error);
    throw error;
  }
};