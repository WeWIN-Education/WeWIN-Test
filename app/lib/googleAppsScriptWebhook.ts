export const DEFAULT_APPS_SCRIPT_WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzYBClvgQRh3fDnS6j5oqubYieaML7lYeuU9z4DAAciYr8rpKKfjLKBH7W1yYGQ2ePA/exec";

export function getAppsScriptWebAppUrl(): string {
  return (
    process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_WEB_APP_URL ||
    DEFAULT_APPS_SCRIPT_WEB_APP_URL
  ).trim();
}

export async function submitIeltsToAppsScript(params: {
  sheetId: string;
  uuid?: string;
  data: Record<string, unknown>;
}) {
  const url = getAppsScriptWebAppUrl();

  if (!url) {
    throw new Error(
      "Missing GOOGLE_APPS_SCRIPT_WEB_APP_URL. Deploy the Sheet Apps Script as a Web App and add the URL to .env.local."
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submitIelts",
      secret: process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET || "",
      sheetId: params.sheetId,
      uuid: params.uuid,
      data: params.data,
    }),
  });

  const text = await res.text();
  let json: any;

  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Apps Script returned non-JSON response: ${text}`);
  }

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || "Apps Script submission failed.");
  }

  return json;
}
