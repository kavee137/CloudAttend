const functions = require("firebase-functions");
const nodemailer = require("nodemailer");




// ✅ Configure Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kaveesharukshan137@gmail.com",
    pass: "qwwqoqqeppmnzqth",
  },
});

// ✅ Cloud Function to send email
export const sendEmailFn = functions.https.onCall(async (data: { to: any; subject: any; message: any; qrCode: any; }, context: any) => {
  const { to, subject, message, qrCode } = data;

  try {
    await transporter.sendMail({
      from: `"Student System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <p>${message}</p>
        ${qrCode ? `<img src="${qrCode}" alt="QR Code" />` : ""}
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Email failed:", error);
    throw new functions.https.HttpsError("internal", "Email failed to send");
  }
});