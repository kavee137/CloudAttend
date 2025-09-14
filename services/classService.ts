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
import { Class } from "@/types/class"; // ✅ your type

// Reference to classes collection
export const classesRef = collection(db, "classes");

// Register new class
export const registerClassInFirestore = async (classData: Class) => {
  try {
    console.log("Registering class:", classData);
    if (!classData.name || !classData.teacherId) {
      throw new Error("Missing required class fields");
    }

    // Save class in Firestore
    const docRef = await addDoc(classesRef, classData);
    const classId = docRef.id;
    console.log("Class added with ID:", classId);

    return { success: true, classId };
  } catch (error) {
    console.error("Error registering class:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Get class by ID
export const getClassById = async (id: string) => {
  const docRef = doc(db, "classes", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Class;
};

// Update class
export const updateClass = async (id: string, updated: Partial<Class>) => {
  const docRef = doc(db, "classes", id);
  await updateDoc(docRef, updated);
};

// Delete class (soft delete by status inactive)
export const deleteClass = async (id: string) => {
  const docRef = doc(db, "classes", id);
  await updateDoc(docRef, {
    status: "inactive"
  });
};

// Get all classes
export const getAllClasses = async (): Promise<Class[]> => {
  const snapshot = await getDocs(classesRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Class[];
};

// Get classes by teacher ID
export const getClassesByTeacher = async (teacherId: string): Promise<Class[]> => {
  const q = query(classesRef, where("teacherId", "==", teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Class[];
};