import { google } from "googleapis";
import { encodeSubject } from "../utils/format";

interface SendEmailParams {
  accessToken: string;
  to: string;
  subject: string;
  html: string;
  pdfBuffer?: Buffer;
  pdfName?: string;
}

export async function sendEmailWithPDF({
  accessToken,
  to,
  subject,
  html,
  pdfBuffer,
  pdfName,
}: SendEmailParams) {
  // Create OAuth2 client with the access token
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const encodedSubject = encodeSubject(subject);

  // Build email parts
  const boundary = "boundary123";
  const parts: string[] = [];

  // Add HTML body
  parts.push(`Content-Type: text/html; charset="UTF-8"\n\n${html}`);

  // Add PDF attachment if provided
  if (pdfBuffer && pdfName) {
    const base64Pdf = pdfBuffer.toString("base64");
    parts.push(
      `Content-Type: application/pdf; name="${pdfName}"\n` +
        `Content-Disposition: attachment; filename="${pdfName}"\n` +
        `Content-Transfer-Encoding: base64\n\n${base64Pdf}`
    );
  }

  // Construct the full email
  const email = [
    `From: "WeWIN IELTS" <me@gmail.com>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    ...parts.map((part, i) => `--${boundary}\n${part}`),
    `--${boundary}--`,
  ].join("\n");

  const encodedMessage = Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encodedMessage },
    });

    console.log("✅ Email sent successfully, messageId:", result.data.id);
    return result.data;
  } catch (error: any) {
    console.error("❌ Gmail API error:", error.message);
    if (error.response?.data) {
      console.error(
        "Error details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    throw error;
  }
}
