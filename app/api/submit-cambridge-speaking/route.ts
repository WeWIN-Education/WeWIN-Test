import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { submitCambridgeSpeakingToAppsScript } from "@/app/lib/googleAppsScriptWebhook";
import { getIeltsSheetId } from "@/app/lib/googleSheetsConfig";

export const runtime = "nodejs";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sheetId = String(body?.sheetId || getIeltsSheetId());
    const data = body?.data || {};
    const id = String(body?.id || randomUUID());

    if (!data.fullName || !data.email || !data.level) {
      return NextResponse.json(
        { success: false, error: "Missing student name, email, or level." },
        { status: 400 }
      );
    }

    const prompts = Array.isArray(data.prompts) ? data.prompts : [];
    const audioBase64 = data.audioBase64 || {};

    if (prompts.length < 2 || !audioBase64[1] || !audioBase64[2]) {
      return NextResponse.json(
        { success: false, error: "Both Cambridge prompts and recordings are required." },
        { status: 400 }
      );
    }

    const result = await submitCambridgeSpeakingToAppsScript({
      sheetId,
      id,
      data,
    });

    return NextResponse.json({
      success: true,
      id: result.id || id,
      row: result.row,
      score: result.score,
      status: result.status,
    });
  } catch (error: unknown) {
    console.error("Cambridge speaking submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Cannot submit Cambridge speaking test."),
      },
      { status: 500 }
    );
  }
}
