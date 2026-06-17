import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/authOptions";
import { isAdminSession } from "@/app/lib/auth";
import { getAppsScriptWebAppUrl } from "@/app/lib/googleAppsScriptWebhook";
import { getIeltsSheetId, SHEET_TABS } from "@/app/lib/googleSheetsConfig";

export const runtime = "nodejs";

interface FinalListRecord {
  id: string;
  name: string;
  email: string;
  score: string;
  writingBand: string;
  writingStatus: string;
  speakingBand: string;
  overallBand: string;
  lastUpdated: string;
  phone: string;
  consultant: string;
  ieltsNeed: string;
  selfScore: string;
  studyTime: string;
  startTime: string;
  finishTime: string;
  source: string;
  notes: string;
}

const FIELD_ALIASES: Record<keyof FinalListRecord, string[]> = {
  id: ["ID"],
  name: ["Name"],
  email: ["Email"],
  score: ["Score"],
  writingBand: ["Writing Band"],
  writingStatus: ["Writing Status"],
  speakingBand: ["Speaking Band"],
  overallBand: ["Overall Band"],
  lastUpdated: ["Last Updated"],
  phone: ["Phone"],
  consultant: ["Consultant"],
  ieltsNeed: ["IELTS Need"],
  selfScore: ["Self Score"],
  studyTime: ["Study Time"],
  startTime: ["Start Time"],
  finishTime: ["Finish Time"],
  source: ["Submission Source"],
  notes: ["Notes"],
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumn(headers: string[], labels: string[]) {
  const normalized = labels.map(normalizeHeader);
  return headers.findIndex((header) => normalized.includes(normalizeHeader(header)));
}

function parseFinalListRows(values: unknown[][]): FinalListRecord[] {
  const [headerRow = [], ...rows] = values;
  const headers = headerRow.map((item) => String(item ?? ""));

  return rows
    .map((row) => {
      const read = (key: keyof FinalListRecord) => {
        const index = findColumn(headers, FIELD_ALIASES[key]);
        return index === -1 ? "" : String(row[index] ?? "").trim();
      };

      return {
        id: read("id"),
        name: read("name"),
        email: read("email"),
        score: read("score"),
        writingBand: read("writingBand"),
        writingStatus: read("writingStatus"),
        speakingBand: read("speakingBand"),
        overallBand: read("overallBand") || read("score"),
        lastUpdated: read("lastUpdated"),
        phone: read("phone"),
        consultant: read("consultant"),
        ieltsNeed: read("ieltsNeed"),
        selfScore: read("selfScore"),
        studyTime: read("studyTime"),
        startTime: read("startTime"),
        finishTime: read("finishTime"),
        source: read("source"),
        notes: read("notes"),
      };
    })
    .filter((record) => record.id || record.email || record.name)
    .sort((a, b) => {
      const left = Date.parse(a.finishTime || a.lastUpdated || a.startTime);
      const right = Date.parse(b.finishTime || b.lastUpdated || b.startTime);
      if (Number.isNaN(left) && Number.isNaN(right)) return 0;
      if (Number.isNaN(left)) return 1;
      if (Number.isNaN(right)) return -1;
      return right - left;
    });
}

async function readFromGoogleSheets(accessToken: string, sheetId: string) {
  const range = `${SHEET_TABS.FINAL}!A2:U`;
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
  return parseFinalListRows(json.values || []);
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
      action: "getFinalList",
      secret: process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET || "",
      sheetId,
    }),
    cache: "no-store",
  });

  const text = await res.text();
  const json = JSON.parse(text);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || "Apps Script getFinalList failed.");
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
  } catch (error: any) {
    try {
      const records = await readFromAppsScript(sheetId);
      return NextResponse.json({
        records,
        source: "apps-script",
        warning: error?.message || "Google Sheets direct read failed.",
      });
    } catch (fallbackError: any) {
      return NextResponse.json(
        {
          error:
            fallbackError?.message ||
            error?.message ||
            "Cannot load Final_list records.",
        },
        { status: 500 }
      );
    }
  }
}
