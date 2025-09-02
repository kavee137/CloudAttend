// services/emailService.ts
import { useAuth } from "@/context/AuthContext";
import { Student } from "@/types/student";

// EmailJS config
const NEXT_PUBLIC_EMAILJS_SERVICE_ID = "service_tz3uet5";
const NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = "template_4amrpzb";
const NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = "lW_gcJPaZJBYSkH9A";

export const sendEmail = async (
  student: Student,
  studentId: string,
  qrCodeURL: string,
  userName?: string
): Promise<boolean> => {
  try {
    const data = {
      service_id: NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      template_id: NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      user_id: NEXT_PUBLIC_EMAILJS_PUBLIC_KEY, // public key
      template_params: {
        institue_name: userName || "Your Institute",
        student_name: student.name,
        qr_code_image: qrCodeURL,
        student_id: studentId,
        title: "Welcome to the Institute",
        email: student.email,
        name: "Admin",
      },
    };

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("✅ Email sent successfully!");
      return true;
    } else {
      const errorText = await response.text();
      console.error("❌ Email failed:", errorText);
      return false;
    }
  } catch (err) {
    console.error("❌ Email send error:", err);
    return false;
  }
};
