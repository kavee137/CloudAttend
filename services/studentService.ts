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
} from "firebase/firestore"
import { db } from "@/firebase"

import { Student } from "@/types/student"


// Reference to students collection
export const studentsRef = collection(db, "students")

// ✅ Add Student
export const addStudent = async (student: Student) => {
  const docRef = await addDoc(studentsRef, student)
  return { ...student, id: docRef.id }
}

// ✅ Get All Students
export const getAllStudents = async () => {
  const snapshot = await getDocs(studentsRef)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]
}

// ✅ Get Students by Institute
export const getStudentsByInstitute = async (instituteId: string) => {
  const q = query(studentsRef, where("instituteId", "==", instituteId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Student[]
}

// ✅ Get Student by ID
export const getStudent = async (id: string) => {
  const docRef = doc(db, "students", id)
  const snapshot = await getDoc(docRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() } as Student
}

// ✅ Update Student
export const updateStudent = async (id: string, updated: Partial<Student>) => {
  const docRef = doc(db, "students", id)
  await updateDoc(docRef, updated)
}

// ✅ Delete Student
export const deleteStudent = async (id: string) => {
  const docRef = doc(db, "students", id)
  await deleteDoc(docRef)
}
