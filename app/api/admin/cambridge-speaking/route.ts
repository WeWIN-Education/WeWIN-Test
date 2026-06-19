import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/authOptions";
import { isAdminSession } from "@/app/lib/auth";
import { getAppsScriptWebAppUrl } from "@/app/lib/googleAppsScriptWebhook";
import { getIeltsSheetId, SHEET_TABS } from "@/app/lib/googleSheetsConfig";

export const runtime = "nodejs";

interface CambridgeSpeakingRecord {
  id: string;
  submitTime: string;
  name: string;
  birthDate: string;
  location: string;
  phone: string;
  email: string;
  consultant: string;
  level: string;
  prompt1: string;
  audioLink1: string;
  transcript1: string;
  prompt2: string;
  audioLink2: string;
  transcript2: string;
  score: string;
  levelFit: string;
  englishFeedback: string;
  vietnameseFeedback: string;
  recommendation: string;
  status: string;
  lastUpdated: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const FIELD_ALIASES: Record<keyof CambridgeSpeakingRecord, string[]> = {
  id: ["ID"],
  submitTime: ["Submit Time"],
  name: ["Name"],
  birthDate: ["Birth Date"],
  location: ["Location"],
  phone: ["Phone"],
  email: ["Email"],
  consultant: ["Consultant"],
  level: ["Level"],
  prompt1: ["Prompt 1"],
  audioLink1: ["Audio Link 1"],
  transcript1: ["Transcript 1"],
  prompt2: ["Prompt 2"],
  audioLink2: ["Audio Link 2"],
  transcript2: ["Transcript 2"],
  score: ["Score"],
  levelFit: ["Level Fit"],
  englishFeedback: ["English Feedback"],
  vietnameseFeedback: ["Vietnamese Feedback"],
  recommendation: ["Recommendation"],
  status: ["Status"],
  lastUpdated: ["Last Updated"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumn(headers: string[], labels: string[]) {
  const normalized = labels.map(normalizeHeader);
  return headers.findIndex((header) => normalized.includes(normalizeHeader(header)));
}

function parseRows(values: unknown[][]): CambridgeSpeakingRecord[] {
  const [headerRow = [], ...rows] = values;
  const headers = headerRow.map((item) => String(item ?? ""));

  return rows
    .map((row) => {
      const read = (key: keyof CambridgeSpeakingRecord) => {
        const index = findColumn(headers, FIELD_ALIASES[key]);
        return index === -1 ? "" : String(row[index] ?? "").trim();
      };

      return {
        id: read("id"),
        submitTime: read("submitTime"),
        name: read("name"),
        birthDate: read("birthDate"),
        location: read("location"),
        phone: read("phone"),
        email: read("email"),
        consultant: read("consultant"),
        level: read("level"),
        prompt1: read("prompt1"),
        audioLink1: read("audioLink1"),
        transcript1: read("transcript1"),
        prompt2: read("prompt2"),
        audioLink2: read("audioLink2"),
        transcript2: read("transcript2"),
        score: read("score"),
        levelFit: read("levelFit"),
        englishFeedback: read("englishFeedback"),
        vietnameseFeedback: read("vietnameseFeedback"),
        recommendation: read("recommendation"),
        status: read("status"),
        lastUpdated: read("lastUpdated"),
      };
    })
    .filter((record) => record.id || record.email || record.name)
    .sort((a, b) => {
      const left = Date.parse(a.submitTime || a.lastUpdated);
      const right = Date.parse(b.submitTime || b.lastUpdated);
      if (Number.isNaN(left) && Number.isNaN(right)) return 0;
      if (Number.isNaN(left)) return 1;
      if (Number.isNaN(right)) return -1;
      return right - left;
    });
}

async function readFromGoogleSheets(accessToken: string, sheetId: string) {
  const range = `${SHEET_TABS.CAMBRIDGE_SPEAKING}!A2:V`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();
  return parseRows(json.values || []);
}

async function readFromAppsScript(sheetId: string) {
  const url = getAppsScriptWebAppUrl();
  if (!url) {
    throw new Error("Missing GOOGLE_APPS_SCRIPT_WEB_APP_URL.");
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getCambridgeSpeaking",
      secret: process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET || "",
      sheetId,
    }),
    cache: "no-store",
  });

  const text = await res.text();
  const json = JSON.parse(text);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || "Apps Script getCambridgeSpeaking failed.");
  }

  return Array.isArray(json.records) ? json.records : [];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sheetId = getIeltsSheetId();

  try {
    const accessToken = String(session?.accessToken || "");
    const records = accessToken
      ? await readFromGoogleSheets(accessToken, sheetId)
      : await readFromAppsScript(sheetId);

    return NextResponse.json({ records, source: accessToken ? "google" : "apps-script" });
  } catch (error: unknown) {
    try {
      const records = await readFromAppsScript(sheetId);
      return NextResponse.json({
        records,
        source: "apps-script",
        warning: getErrorMessage(error, "Google Sheets direct read failed."),
      });
    } catch (fallbackError: unknown) {
      return NextResponse.json(
        {
          error:
            getErrorMessage(
              fallbackError,
              getErrorMessage(error, "Cannot load Speaking_Cambridge records.")
            ),
        },
        { status: 500 }
      );
    }
  }
}
