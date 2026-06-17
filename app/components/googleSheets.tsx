// app/components/googleSheets.tsx

import { SHEET_TABS } from "@/app/lib/googleSheetsConfig";

// =====================
// TYPES
// =====================

interface AppendFinalListParams {
  accessToken: string;
  sheetId: string;
  id: string;
  name: string;
  email: string;
  score: number;
  pdfUrl?: string;
  writingBand?: number | string;
  writingFeedback?: string;
  writingStatus?: string;
  speakingBand?: number | string;
  speakingPdf?: string;
  overallBand?: number | string;
  phone?: string;
  consultant?: string;
  ieltsNeed?: string;
  selfScore?: string;
  studyTime?: string;
  startTime?: string;
  finishTime?: string;
  lastUpdated?: string;
  source?: string;
  notes?: string;
}

interface SkillStats {
  correct: number;
  totalPoint: number;
  max: number;
  q: number;
}

interface AppendIELTSListParams {
  accessToken: string;
  sheetId: string;
  id: string;
  fullName: string;
  birthDate: string;
  location: string;
  phone: string;
  email: string;
  consultant: string;
  ieltsNeed: string;
  selfScore: string;
  studyTime: string;
  startTime: string;
  finishTime: string;
  listening: string[];
  reading: string[];
  writingAnswer: string;
  // ⭐ NEW: Detailed scoring fields
  totalScore?: number;
  maxScore?: number;
  correctCount?: number;
  totalQuestions?: number;
  grammarReadingBand?: number;
  writingBand?: number;
  overallBand?: number;
  skillStats?: Record<string, SkillStats>;
}

export interface AnswerRow {
  question: string;
  answer: string;
  skill: string;
  point: number;
}

// ⭐ NEW: Answer Key interface for grading
export interface AnswerKey {
  answers: string[];
  skills: string[];
  points: number[];
}

// =====================
// APPEND FINAL LIST
// =====================

export async function appendFinalList(params: AppendFinalListParams) {
  const {
    accessToken,
    sheetId,
    id,
    name,
    email,
    score,
    pdfUrl,
    writingBand,
    writingFeedback,
    writingStatus,
    speakingBand,
    speakingPdf,
    overallBand,
    phone,
    consultant,
    ieltsNeed,
    selfScore,
    studyTime,
    startTime,
    finishTime,
    lastUpdated,
    source,
    notes,
  } = params;

  const range = `${SHEET_TABS.FINAL}!A:U`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const scoreValue = score ?? "";
  const finalOverallBand = overallBand ?? scoreValue;
  const row = [
    id,
    name,
    email,
    scoreValue,
    pdfUrl || "",
    writingBand || "",
    writingFeedback || "",
    writingStatus || "",
    speakingBand || "",
    speakingPdf || "",
    finalOverallBand,
    lastUpdated || finishTime || "",
    phone ? `'${phone}` : "",
    consultant || "",
    ieltsNeed || "",
    selfScore || "",
    studyTime || "",
    startTime || "",
    finishTime || "",
    source || "next-api",
    notes || "",
  ];

  const body = {
    values: [row],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ appendFinalList error:", text);
    throw new Error("Failed to append Final_list");
  }

  console.log("✅ Final_list appended successfully");
}

// =====================
// APPEND GRAMMAR LIST (ENHANCED)
// =====================

export async function appendIELTSList(params: AppendIELTSListParams) {
  const {
    accessToken,
    sheetId,
    id,
    fullName,
    birthDate,
    location,
    phone,
    email,
    consultant,
    ieltsNeed,
    selfScore,
    studyTime,
    startTime,
    finishTime,
    listening,
    writingAnswer,
    reading,
    // New scoring fields
    totalScore,
    maxScore,
    correctCount,
    totalQuestions,
    grammarReadingBand,
    writingBand,
    overallBand,
    skillStats,
  } = params;

  const normalizedListening = Array.from(
    { length: 18 },
    (_, i) => listening?.[i] || ""
  );
  const normalizedReading = Array.from(
    { length: 13 },
    (_, i) => reading?.[i] || ""
  );

  // Match the live Listening_list sheet exactly: A:AR.
  const row = [
    id, // A
    startTime, // B
    finishTime, // C
    fullName, // D
    birthDate, // E
    location, // F
    phone ? `'${phone}` : "", // G
    email, // H
    consultant, // I
    ieltsNeed, // J
    selfScore, // K
    studyTime, // L
    ...normalizedListening, // M:AD
    writingAnswer, // AE
    ...normalizedReading, // AF:AR
  ];

  const range = `${SHEET_TABS.LISTENING}!A:AR`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const body = { values: [row] };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("❌ appendGrammarList error:", t);
    throw new Error("Failed to append Listening_list");
  }

  console.log("✅ Listening_list appended with detailed scores");
}

// =====================
// FETCH ANSWERS (ANSWER KEY)
// =====================

export async function fetchAnswersFromSheet(
  accessToken: string,
  sheetId: string,
  sheetName = SHEET_TABS.ANSWERS
): Promise<AnswerRow[]> {
  const range = `${sheetName}!A2:D`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ fetchAnswersFromSheet error:", text);
    throw new Error("Failed to read Answers sheet");
  }

  const data = await res.json();
  const rows = data.values || [];

  return rows.map((r: any[]) => ({
    question: r[0] || "",
    answer: r[1]?.trim() || "",
    skill: r[2] || "Unknown",
    point: Number(r[3] || 1),
  }));
}

// ⭐ NEW: Transform AnswerRow[] to AnswerKey format
export function transformToAnswerKey(answerRows: AnswerRow[]): AnswerKey {
  return {
    answers: answerRows.map((row) => row.answer),
    skills: answerRows.map((row) => row.skill),
    points: answerRows.map((row) => row.point),
  };
}

// ⭐ NEW: Fetch and transform in one call
export async function fetchAnswerKey(
  accessToken: string,
  sheetId: string,
  sheetName = SHEET_TABS.ANSWERS
): Promise<AnswerKey> {
  const answerRows = await fetchAnswersFromSheet(
    accessToken,
    sheetId,
    sheetName
  );
  return transformToAnswerKey(answerRows);
}

// =====================
// UPDATE EXISTING ROW (OPTIONAL)
// =====================

export async function updateGrammarListRow(params: {
  accessToken: string;
  sheetId: string;
  rowNumber: number; // Row number in sheet (1-based)
  values: any[];
}) {
  const { accessToken, sheetId, rowNumber, values } = params;

  const range = `Listening_list!A${rowNumber}:AZ${rowNumber}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const body = { values: [values] };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ updateGrammarListRow error:", text);
    throw new Error("Failed to update Listening_list row");
  }

  console.log(`✅ Listening_list row ${rowNumber} updated`);
}

// =====================
// FIND ROW BY EMAIL OR UUID
// =====================

export async function findRowByIdentifier(params: {
  accessToken: string;
  sheetId: string;
  sheetName: string;
  identifier: string; // Email or UUID
  searchColumn: "A" | "H"; // A for UUID, H for Email
}): Promise<number | null> {
  const { accessToken, sheetId, sheetName, identifier, searchColumn } = params;

  const range = `${sheetName}!${searchColumn}:${searchColumn}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  const values = data.values || [];

  const rowIndex = values.findIndex((row: any[]) => row[0] === identifier);

  // Return 1-based row number (add 1 because arrays are 0-based)
  return rowIndex >= 0 ? rowIndex + 1 : null;
}

// =====================
// BATCH UPDATE MULTIPLE CELLS
// =====================

export async function batchUpdateSheet(params: {
  accessToken: string;
  sheetId: string;
  updates: Array<{
    range: string;
    values: any[][];
  }>;
}) {
  const { accessToken, sheetId, updates } = params;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;

  const body = {
    valueInputOption: "USER_ENTERED",
    data: updates.map((update) => ({
      range: update.range,
      values: update.values,
    })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ batchUpdateSheet error:", text);
    throw new Error("Failed to batch update sheet");
  }

  console.log("✅ Batch update completed");
}

// =====================
// GET SKILL STATISTICS SUMMARY
// =====================

export function getSkillsSummary(
  skillStats: Record<string, SkillStats>
): string {
  const lines: string[] = [];

  for (const [skill, stats] of Object.entries(skillStats)) {
    const percentage = Math.round((stats.correct / stats.q) * 100);
    lines.push(`${skill}: ${stats.correct}/${stats.q} (${percentage}%)`);
  }

  return lines.join(" | ");
}

// =====================
// CONVERT BAND SCORE HELPERS
// =====================

export function scoreToIELTSBand(score: number, maxScore: number): number {
  // Convert raw score to IELTS band (0-9 scale)
  // Round to nearest 0.5
  const ratio = score / maxScore;
  const band = ratio * 9;
  return Math.round(band * 2) / 2;
}

export function averageBands(...bands: number[]): number {
  const validBands = bands.filter((b) => b > 0);
  if (validBands.length === 0) return 0;

  const average = validBands.reduce((sum, b) => sum + b, 0) / validBands.length;
  return Math.round(average * 2) / 2;
}

// =====================
// EXPORT ALL
// =====================

export type { AppendFinalListParams, AppendIELTSListParams as AppendGrammarListParams, SkillStats };
