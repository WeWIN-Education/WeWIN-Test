import { google } from "googleapis";

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
];

interface ServiceAccountCredentials {
  client_email?: string;
  private_key?: string;
}

function readServiceAccountCredentials(): ServiceAccountCredentials | null {
  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as ServiceAccountCredentials;
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key?.replace(/\\n/g, "\n"),
      };
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) return null;

  return {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

export async function getGoogleAccessToken(
  userAccessToken?: string | null
): Promise<string> {
  const token = userAccessToken?.trim();
  if (token) return token;

  const credentials = readServiceAccountCredentials();
  if (!credentials?.client_email || !credentials.private_key) {
    throw new Error(
      "Missing Google permission. Sign in with Google or configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY on the server."
    );
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: GOOGLE_SCOPES,
  });

  const accessToken = await auth.getAccessToken();
  const value =
    typeof accessToken === "string" ? accessToken : accessToken?.token;

  if (!value) {
    throw new Error("Could not create a Google service account access token.");
  }

  return value;
}
