import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  User,
  reload,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";


// Register + send verification email
export const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (userCredential.user) {
    await sendEmailVerification(userCredential.user);
  }
  return userCredential.user;
};

// Login
export const login = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Create Institute doc in Firestore
export const createInstitute = async (uid: string, instituteName: string, email: string) => {
  await setDoc(doc(db, "institutes", uid), {
    instituteName,
    email,
    createdAt: new Date(),
  });
};

// Check verification status
export const checkEmailVerified = async (user: User) => {
  await reload(user);
  return user.emailVerified;
};

export const logout = async () => {
  return signOut(auth);
};
