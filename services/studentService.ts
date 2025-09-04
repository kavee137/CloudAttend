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
import { Student } from "@/types/student";
import { sendStudentEmail } from "@/util/sendEmail";


// Reference to students collection
export const studentsRef = collection(db, "students");

// Register student and send email
export const registerStudentInFirestore = async (student: Student, instituteName: string) => {
  try {
    // 1. Save student in Firestore
    const docRef = await addDoc(studentsRef, student);
    const studentId = docRef.id;

    // 2. Generate QR
    const qrData = encodeURIComponent(`STUDENT_ID:${studentId}`);
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}&bgcolor=FFFFFF&color=000000`;

    // 3. Send Email using separate function
    const emailResult = await sendStudentEmail({
      instituteName,
      studentName: student.name,
      studentEmail: student.email,
      studentId,
      qrCodeURL,
    });

    if (!emailResult.success) {
      console.log("Failed to send email:", emailResult.error);
    }

    console.log("Student registered with ID:", studentId);
    return { success: true, studentId };
  } catch (error) {
    console.error("Error registering student:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};






// Get student by ID
export const getStudent = async (id: string) => {
  const docRef = doc(db, "students", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Student;
};

// Update student
export const updateStudent = async (id: string, updated: Partial<Student>) => {
  const docRef = doc(db, "students", id);
  await updateDoc(docRef, updated);
};

// Delete student
export const deleteStudent = async (id: string) => {
  const docRef = doc(db, "students", id);
  await updateDoc(docRef, {
    status: "inactive"
  });
};

// Get all students
export const getAllStudents = async (): Promise<Student[]> => {
  const snapshot = await getDocs(studentsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[];
};

// Get students by institute
export const getStudentsByInstitute = async (instituteId: string): Promise<Student[]> => {
  const q = query(studentsRef, where("instituteId", "==", instituteId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[];
};
