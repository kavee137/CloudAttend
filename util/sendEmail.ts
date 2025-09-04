import { send, EmailJSResponseStatus } from "@emailjs/browser";

export const sendStudentEmail = async (params: {
  instituteName: string;
  studentName: string;
  studentEmail: string;
  studentId: string;
  qrCodeURL: string;
}) => {
  const {
    instituteName,
    studentName,
    studentEmail,
    studentId,
    qrCodeURL,
  } = params;

  try {
    await send(
      process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID!,
      {
        institute_name: instituteName || '',
        student_name: studentName || '',
        qr_code_image: qrCodeURL,
        email: studentEmail || '',
        student_id: studentId,
        name: studentName || ''
      },
      {
        publicKey: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY!,
      },
    );

    console.log("Email sent successfully!");
    return { success: true };
  } catch (err) {
    if (err instanceof EmailJSResponseStatus) {
      console.log("EmailJS Request Failed...", err);
    }

    console.error("Error sending email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
};



