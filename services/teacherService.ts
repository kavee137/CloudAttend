import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/firebase";
import { Teacher } from "@/types/teacher";



// Reference to teachers collection
export const teachersRef = collection(db, "teachers");

// Register teacher
export const registerTeacherInFirestore = async (teacher: Teacher, instituteName: string) => {
  try {
    console.log("Registrrering teacher:", teacher);
    if (!teacher.name || !teacher.email || !teacher.instituteId) {
      throw new Error("Missing required teacher fields");
    }
    // 1. Save teacher in Firestore
    const docRef = await addDoc(teachersRef, teacher);
    const teacherId = docRef.id;
    console.log("Teacher added with ID:", teacherId);
 
    return { success: true, teacherId };
  } catch (error) {
    console.error("Error registering teacher:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};






// Get teacher by ID
export const getTeacher = async (id: string) => {
  const docRef = doc(db, "teachers", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Teacher;
};

// Update teacher
export const updateTeacher = async (id: string, updated: Partial<Teacher>) => {
  const docRef = doc(db, "teachers", id);
  await updateDoc(docRef, updated);
};

// Delete teacher
export const deleteTeacher = async (id: string) => {
  const docRef = doc(db, "teachers", id);
  await updateDoc(docRef, {
    status: "inactive"
  });
};

// Get all teachers
export const getAllTeacher = async (): Promise<Teacher[]> => {
  const snapshot = await getDocs(teachersRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Teacher[];
};

// Get teachers by institute
export const getTeachersByInstitute = async (instituteId: string): Promise<Teacher[]> => {
  const q = query(teachersRef, where("instituteId", "==", instituteId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Teacher[];
};