import React, { useRef, useEffect } from "react";
import { WebView } from "react-native-webview";

const SERVICE_ID = "service_bf0scpf";
const TEMPLATE_ID = "template_k8ib6gs";
const PUBLIC_KEY = "ERaBeaUPjSYVXqgr2";

interface Props {
  email: string;
  studentId: string;
  studentName: string;
  instituteName?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SendStudentEmailWebView: React.FC<Props> = ({
  email,
  studentId,
  studentName,
  instituteName,
  onSuccess,
  onError,
}) => {
  const webviewRef = useRef<any>(null);

  const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    `STUDENT_ID:${studentId}`
  )}`;

  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8" />
        <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
      </head>
      <body>
        <h1>EmailJS WebView</h1>
        <script>
          document.addEventListener("message", function(event) {
            const data = JSON.parse(event.data);

            emailjs.init(data.publicKey);

            emailjs.send(data.serviceId, data.templateId, data.params)
              .then(function(response) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ success: true, response }));
              })
              .catch(function(error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ success: false, error }));
              });
          });
        </script>
      </body>
    </html>
  `;

  // After WebView loads, send data to it
  useEffect(() => {
    if (webviewRef.current) {
      const params = {
        serviceId: SERVICE_ID,
        templateId: TEMPLATE_ID,
        publicKey: PUBLIC_KEY,
        params: {
          to_email: email,
          student_name: studentName,
          student_id: studentId,
          qr_code_image: qrCodeURL,
          institute_name: instituteName || "Your Institute",
        },
      };
      setTimeout(() => {
        webviewRef.current.postMessage(JSON.stringify(params));
      }, 1000); // small delay to ensure WebView is ready
    }
  }, [email, studentId, studentName]);

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={["*"]}
      source={{ html: htmlContent }}
      style={{ height: 0, width: 0 }}
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.success) {
            onSuccess?.();
          } else {
            onError?.(data.error?.text || "Email failed");
          }
        } catch (e) {
          onError?.("Invalid WebView message");
        }
      }}
    />
  );
};

export default SendStudentEmailWebView;
