import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { evaluateWriting } from "../generate-ielts/route";

import {
  appendFinalList,
  appendIELTSList,
  fetchAnswersFromSheet,
  transformToAnswerKey,
  scoreToIELTSBand,
  averageBands,
} from "@/app/components/googleSheets";

import { formatTimestamp, toPureArrayBuffer } from "@/app/utils/format";
import { sendEmailWithPDF } from "@/app/components/sendMail";
import { buildAdminIeltsEmailHTML } from "@/app/components/adminIeltsEmail";
import { adminEmails } from "@/app/constants/email";
import { getGoogleAccessToken } from "@/app/lib/googleServerAuth";
import { submitIeltsToAppsScript } from "@/app/lib/googleAppsScriptWebhook";

export const runtime = "nodejs";

/* ============================================= */
/* TYPES */
/* ============================================= */
interface SkillStats {
  correct: number;
  totalPoint: number;
  max: number;
  q: number;
}

interface WrongAnswer {
  q: number;
  correct: string;
  user: string;
  skill: string;
}

interface GradingResult {
  skillStats: Record<string, SkillStats>;
  correctCount: number;
  wrongAnswers: WrongAnswer[];
  totalScore: number;
  maxScore: number;
  totalQuestions: number;
}

interface WritingScore {
  overallBand: number;
  taskAchievement: string;
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalRange: string;
  suggestions: string;
}

type SpeakingStatus = "done" | "pending" | "error";
type SpeakingPartKey = "part1" | "part2" | "part3";

interface SpeakingEvaluation {
  status: SpeakingStatus;
  overallBand: number;
  summary: string;
  fluencyCoherence: string;
  lexicalResource: string;
  grammaticalRangeAccuracy: string;
  pronunciation: string;
  recommendations: string;
  transcripts: Record<SpeakingPartKey, string>;
  wordCounts: Record<SpeakingPartKey | "total", number>;
  warnings: string[];
}

interface AudioPayload {
  buffer: Buffer;
  contentType: string;
}

/* ============================================= */
/* GRADING LOGIC */
/* ============================================= */
function gradeResponses(
  responses: string[],
  answerKey: { answers: string[]; skills: string[]; points: number[] }
): GradingResult {
  const { answers, skills, points } = answerKey;
  const n = Math.min(responses.length, answers.length);

  // Helper functions
  const normalize = (s: any) =>
    String(s || "")
      .trim()
      .toLowerCase();
  const toOpts = (s: any) =>
    String(s || "")
      .split(/[,/]/)
      .map(normalize)
      .filter(Boolean);
  const isLetter = (arr: string[]) => arr.every((x) => /^[a-e]$/i.test(x));

  const stats: Record<string, SkillStats> = {};
  let correct = 0;
  const wrong: WrongAnswer[] = [];
  let total = 0;

  for (let i = 0; i < n; i++) {
    const user = String(responses[i] || "").trim();
    const ans = String(answers[i] || "").trim();
    const skill = skills[i] || "Unknown";
    const point = points[i] || 1;

    // Initialize skill stats
    if (!stats[skill]) {
      stats[skill] = { correct: 0, totalPoint: 0, max: 0, q: 0 };
    }

    stats[skill].max += point;
    stats[skill].q++;

    // Check if answer is correct
    const ok = isLetter(toOpts(ans))
      ? toOpts(ans).includes(user[0]?.toLowerCase())
      : toOpts(ans).includes(normalize(user));

    if (ok) {
      correct++;
      total += point;
      stats[skill].correct++;
      stats[skill].totalPoint += point;
    } else {
      wrong.push({ q: i + 1, correct: ans, user, skill });
    }
  }

  return {
    skillStats: stats,
    correctCount: correct,
    wrongAnswers: wrong,
    totalScore: total,
    maxScore: points.slice(0, n).reduce((a, b) => a + b, 0),
    totalQuestions: n,
  };
}

/* ============================================= */
/* PARSE WRITING RESPONSE – FIXED FOR GPT JSON */
/* ============================================= */
function parseWritingResponse(response: any): WritingScore {
  try {
    // Nếu GPT đã trả object đúng format
    if (typeof response === "object" && response !== null) {
      return {
        overallBand: Number(response.overall || 0),
        taskAchievement: response.task || "",
        coherenceCohesion: response.coherence || "",
        lexicalResource: response.lexical || "",
        grammaticalRange: response.grammar || "",
        suggestions: response.suggestion || "",
      };
    }

    // Nếu là string → parse lại
    if (typeof response === "string") {
      return parseWritingResponse(JSON.parse(response));
    }

    throw new Error("Invalid Writing JSON format");
  } catch (error) {
    console.error("⚠ Writing parse error:", response);

    return {
      overallBand: 0,
      taskAchievement: "",
      coherenceCohesion: "",
      lexicalResource: "",
      grammaticalRange: "",
      suggestions: "Không thể phân tích bài Writing do lỗi định dạng.",
    };
  }
}

function emptySpeakingEvaluation(
  status: SpeakingStatus,
  message: string,
  warnings: string[] = []
): SpeakingEvaluation {
  return {
    status,
    overallBand: 0,
    summary: message,
    fluencyCoherence: "",
    lexicalResource: "",
    grammaticalRangeAccuracy: "",
    pronunciation: "",
    recommendations:
      "The office should review the audio file or arrange a manual Speaking check if detailed consultation is needed.\nOffice nên xem lại file ghi âm hoặc chấm Speaking thủ công nếu cần tư vấn chi tiết.",
    transcripts: {
      part1: "",
      part2: "",
      part3: "",
    },
    wordCounts: {
      part1: 0,
      part2: 0,
      part3: 0,
      total: 0,
    },
    warnings,
  };
}

function normalizeJsonText(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extractJsonObject(text: string) {
  const cleaned = normalizeJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("OpenAI did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function parseBand(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 9) return 9;
  return Math.round(n * 2) / 2;
}

function countWords(text: string) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter((word) => /\w/.test(word)).length;
}

function audioFromDataUrl(value: unknown): AudioPayload | null {
  const raw = String(value || "");
  const match = raw.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1] || "audio/webm",
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extractDriveFileId(link: string) {
  if (!link) return "";
  if (link.includes("id=")) return link.split("id=")[1].split("&")[0];
  if (link.includes("/d/")) return link.split("/d/")[1].split("/")[0];
  return "";
}

function mimeToExt(contentType: string) {
  const clean = contentType.toLowerCase();
  if (clean.includes("mp4") || clean.includes("m4a")) return ".m4a";
  if (clean.includes("mpeg") || clean.includes("mp3")) return ".mp3";
  if (clean.includes("wav")) return ".wav";
  if (clean.includes("ogg")) return ".ogg";
  return ".webm";
}

async function downloadAudioFromDrive(
  accessToken: string,
  link: string
): Promise<AudioPayload | null> {
  const fileId = extractDriveFileId(link);
  if (!fileId) return null;

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return null;

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "audio/webm",
  };
}

async function transcribeAudio(payload: AudioPayload): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || payload.buffer.length === 0) return null;

  const blob = new Blob([toPureArrayBuffer(payload.buffer)], {
    type: payload.contentType,
  });
  const form = new FormData();
  form.append("file", blob, `speaking${mimeToExt(payload.contentType)}`);
  form.append("model", "whisper-1");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    console.warn("Whisper failed:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  return String(json.text || "").trim() || null;
}

function formatSpeakingQuestions(questions: any) {
  if (!questions) return "";

  const part1 = Array.isArray(questions.part1)
    ? questions.part1.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")
    : "";

  const part2 = questions.part2
    ? [
        questions.part2.topic,
        ...(Array.isArray(questions.part2.bullets)
          ? questions.part2.bullets.map((b: string) => `- ${b}`)
          : []),
        questions.part2.followUp
          ? `Follow-up: ${questions.part2.followUp}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const part3 = questions.part3
    ? [
        questions.part3.reading,
        ...(Array.isArray(questions.part3.questions)
          ? questions.part3.questions.map((q: string, i: number) => `${i + 1}. ${q}`)
          : []),
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return [
    part1 ? `Part 1\n${part1}` : "",
    part2 ? `Part 2\n${part2}` : "",
    part3 ? `Part 3\n${part3}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function analyzeSpeakingWithAI(params: {
  fullName: string;
  email: string;
  questionsText: string;
  transcripts: Record<SpeakingPartKey, string>;
  wordCounts: Record<SpeakingPartKey | "total", number>;
}): Promise<Omit<SpeakingEvaluation, "transcripts" | "wordCounts" | "warnings">> {
  const apiKey = process.env.OPENAI_API_KEY;
  const transcriptText = [
    `Part 1: ${params.transcripts.part1}`,
    `Part 2: ${params.transcripts.part2}`,
    `Part 3: ${params.transcripts.part3}`,
  ].join("\n\n");

  if (!apiKey || !transcriptText.trim()) {
    return {
      status: "pending",
      overallBand: 0,
      summary:
        "Speaking could not be evaluated by AI because the OpenAI key or transcript is missing.\nSpeaking chưa được AI chấm vì thiếu OPENAI_API_KEY hoặc chưa có transcript.",
      fluencyCoherence: "",
      lexicalResource: "",
      grammaticalRangeAccuracy: "",
      pronunciation: "",
      recommendations:
        "The office should arrange a manual Speaking review or check the OpenAI configuration.\nOffice nên chấm Speaking thủ công hoặc kiểm tra lại cấu hình OpenAI.",
    };
  }

  const prompt = `
You are an IELTS Speaking examiner. Evaluate this candidate's speaking test for office consultation.
Return ONLY valid JSON with this exact shape:
{
  "overallBand": 6.5,
  "summary": "English feedback paragraph.\nVietnamese feedback paragraph.",
  "fluencyCoherence": "English feedback paragraph.\nVietnamese feedback paragraph.",
  "lexicalResource": "English feedback paragraph.\nVietnamese feedback paragraph.",
  "grammaticalRangeAccuracy": "English feedback paragraph.\nVietnamese feedback paragraph.",
  "pronunciation": "English feedback paragraph.\nVietnamese feedback paragraph.",
  "recommendations": "English advice for the office.\nVietnamese advice for the office."
}

Rules:
- Keep feedback concise and practical.
- For every text field, write exactly two language blocks: first English, then Vietnamese.
- Separate English and Vietnamese with one newline character.
- Do not use labels like English:, Vietnamese:, EN:, VI:.
- Do not mix English and Vietnamese on the same line.
- Do not use markdown.
- If audio/transcript is too short, lower confidence and explain this.

Candidate:
Name: ${params.fullName}
Email: ${params.email}
Word counts:
Part 1: ${params.wordCounts.part1}
Part 2: ${params.wordCounts.part2}
Part 3: ${params.wordCounts.part3}
Total: ${params.wordCounts.total}

Questions:
${params.questionsText || "(No questions provided)"}

Transcript:
${transcriptText}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI Speaking evaluation failed: ${res.status}`);
  }

  const json = await res.json();
  const parsed = extractJsonObject(json.choices?.[0]?.message?.content || "{}");

  return {
    status: "done",
    overallBand: parseBand(parsed.overallBand),
    summary: String(parsed.summary || ""),
    fluencyCoherence: String(parsed.fluencyCoherence || ""),
    lexicalResource: String(parsed.lexicalResource || ""),
    grammaticalRangeAccuracy: String(parsed.grammaticalRangeAccuracy || ""),
    pronunciation: String(parsed.pronunciation || ""),
    recommendations: String(parsed.recommendations || ""),
  };
}

async function evaluateSpeakingSubmission(params: {
  speaking: any;
  googleAccessToken: string;
  fullName: string;
  email: string;
}): Promise<SpeakingEvaluation> {
  const speaking = params.speaking || {};
  const audioBase64 = speaking.audioBase64 || {};
  const audioLinks = Array.isArray(speaking.audioLinks) ? speaking.audioLinks : [];
  const transcripts: Record<SpeakingPartKey, string> = {
    part1: "",
    part2: "",
    part3: "",
  };
  const wordCounts: Record<SpeakingPartKey | "total", number> = {
    part1: 0,
    part2: 0,
    part3: 0,
    total: 0,
  };
  const warnings: string[] = [];

  for (const part of [1, 2, 3] as const) {
    const key = `part${part}` as SpeakingPartKey;
    const fromBase64 = audioFromDataUrl(audioBase64[part] || audioBase64[String(part)]);
    const link = audioLinks.find((item: any) => Number(item.part) === part)?.link;

    let audio = fromBase64;
    if (!audio && link) {
      audio = await downloadAudioFromDrive(params.googleAccessToken, link);
    }

    if (!audio) {
      warnings.push(`Speaking Part ${part}: không có audio để chấm.`);
      continue;
    }

    const transcript = await transcribeAudio(audio);
    if (!transcript) {
      warnings.push(`Speaking Part ${part}: không phiên âm được audio.`);
      continue;
    }

    transcripts[key] = transcript;
    wordCounts[key] = countWords(transcript);
    wordCounts.total += wordCounts[key];
  }

  const hasTranscript = Object.values(transcripts).some((text) => text.trim());
  if (!hasTranscript) {
    return emptySpeakingEvaluation(
      "pending",
      "Speaking could not be evaluated by AI because no transcript was generated from the audio.\nSpeaking chưa được AI chấm vì chưa có transcript từ audio.",
      warnings
    );
  }

  try {
    const analysis = await analyzeSpeakingWithAI({
      fullName: params.fullName,
      email: params.email,
      questionsText: formatSpeakingQuestions(speaking.questions),
      transcripts,
      wordCounts,
    });

    return {
      ...analysis,
      transcripts,
      wordCounts,
      warnings,
    };
  } catch (error: any) {
    return {
      ...emptySpeakingEvaluation(
        "error",
        "Speaking has a transcript, but the AI evaluation could not be completed.\nSpeaking đã có transcript nhưng AI chưa chấm được.",
        [...warnings, error?.message || "Unknown Speaking AI error"]
      ),
      transcripts,
      wordCounts,
    };
  }
}

/* ============================================= */
/* MAIN POST HANDLER */
/* ============================================= */
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------
    // 0. READ BODY SAFELY
    // ---------------------------------------------------
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON from client" },
        { status: 400 }
      );
    }

    const { accessToken, sheetId, uuid, data } = body;

    // Validate required fields
    if (!sheetId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: sheetId or data" },
        { status: 400 }
      );
    }

    const hasUserGoogleToken = Boolean(String(accessToken || "").trim());

    if (!hasUserGoogleToken && process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL) {
      const appScriptResult = await submitIeltsToAppsScript({
        sheetId,
        uuid,
        data,
      });

      return NextResponse.json({
        success: true,
        via: "apps-script",
        uuid: appScriptResult.uuid || uuid,
        warnings: [
          "Submitted through the Google Sheet Apps Script Web App because this session has no Google OAuth token.",
        ],
        appScriptResult,
      });
    }

    let googleAccessToken: string;

    try {
      googleAccessToken = await getGoogleAccessToken(accessToken);
    } catch (authError: any) {
      try {
        const appScriptResult = await submitIeltsToAppsScript({
          sheetId,
          uuid,
          data,
        });

        return NextResponse.json({
          success: true,
          via: "apps-script",
          uuid: appScriptResult.uuid || uuid,
          warnings: [
            "Submitted directly through the Google Sheet Apps Script Web App.",
          ],
          appScriptResult,
        });
      } catch (webAppError: any) {
        throw new Error(
          `${authError.message} Apps Script fallback also failed: ${webAppError.message}`
        );
      }
    }

    // ---------------------------------------------------
    // 1. EXTRACT VARIABLES
    // ---------------------------------------------------
    const {
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
      listening,
      writingAnswer,
      reading,
      speaking,
    } = data;

    const readingArr = Array.isArray(reading)
      ? reading
      : Object.values(reading || {});

    const id = uuid || randomUUID();
    const finishTime = formatTimestamp();

    const rawAnswerKey = await fetchAnswersFromSheet(
      googleAccessToken,
      sheetId
    );
    const answerKey = transformToAnswerKey(rawAnswerKey);

    console.log("✅ Answer key loaded:", answerKey.answers.length, "questions");

    // ---------------------------------------------------
    // 4. GRADE GRAMMAR + READING (COMBINED)
    // ---------------------------------------------------
    console.log("📝 Grading Grammar + Reading...");
    const allResponses = [...listening, ...readingArr];
    const gradingResult = gradeResponses(allResponses, answerKey);

    console.log("✅ Grading completed:");
    console.log(
      "   - Total Score:",
      gradingResult.totalScore,
      "/",
      gradingResult.maxScore
    );
    console.log(
      "   - Correct:",
      gradingResult.correctCount,
      "/",
      gradingResult.totalQuestions
    );
    console.log("   - Skills:", Object.keys(gradingResult.skillStats));

    // ---------------------------------------------------
    // 5. EVALUATE WRITING WITH GPT
    // ---------------------------------------------------
    console.log("✍️ Evaluating writing...");

    let writingScore: WritingScore;

    try {
      const writingResult = await evaluateWriting(writingAnswer);
      writingScore = parseWritingResponse(writingResult);
      console.log("✅ Writing evaluated - Band:", writingScore.overallBand);
    } catch (writingError: any) {
      console.error("❌ Writing evaluation error:", writingError);
      writingScore = {
        overallBand: 0,
        taskAchievement: "Error evaluating writing",
        coherenceCohesion: "",
        lexicalResource: "",
        grammaticalRange: "",
        suggestions: writingError.message,
      };
    }

    // ---------------------------------------------------
    // 6. CALCULATE IELTS BAND SCORES
    // ---------------------------------------------------
    // Grammar + Reading band (convert to IELTS 0-9 scale)
    const grammarReadingBand = scoreToIELTSBand(
      gradingResult.totalScore,
      gradingResult.maxScore
    );
    const writingBand = writingScore.overallBand;

    // ---------------------------------------------------
    // 6b. EVALUATE SPEAKING WITH WHISPER + GPT
    // ---------------------------------------------------
    console.log("🎙️ Evaluating speaking...");
    const speakingEvaluation = await evaluateSpeakingSubmission({
      speaking,
      googleAccessToken,
      fullName,
      email,
    });
    const speakingBand = speakingEvaluation.overallBand;

    // Overall band (average, rounded to nearest 0.5)
    const overallBand = averageBands(
      grammarReadingBand,
      writingBand,
      speakingBand
    );

    // ---------------------------------------------------
    // 7. APPEND GRAMMAR LIST WITH DETAILED SCORES
    // ---------------------------------------------------
    const warnings: string[] = [];

    console.log("📝 Saving results to Listening_list...");
    try {
      await appendIELTSList({
        accessToken: googleAccessToken,
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
        reading: readingArr,
      });
    } catch (sheetError: any) {
      const message = sheetError?.message || "Không ghi được Listening_list";
      console.error("⚠️ Listening_list update failed:", message);
      warnings.push(
        "Không ghi được Google Sheet (Listening_list). Kiểm tra quyền Editor trên sheet hoặc dùng sheet của bạn trong GOOGLE_SHEETS_ID."
      );
    }

    if (
      writingScore.suggestions?.toLowerCase().includes("api key") ||
      writingScore.taskAchievement?.toLowerCase().includes("error evaluating")
    ) {
      warnings.push("OpenAI API key không hợp lệ — bỏ qua chấm Writing.");
    }

    // ---------------------------------------------------
    // 8. SEND EMAIL WITH PROFESSIONAL TEMPLATE
    // ---------------------------------------------------
    console.log("📧 Sending email...");
    let emailSent = false;
    let emailError = null;

    console.log("📧 Sending admin IELTS report email...");
    try {
      const emailHTML = buildAdminIeltsEmailHTML({
        student: {
          fullName,
          birthDate,
          location,
          phone,
          email,
          consultant,
          ieltsNeed,
          selfScore,
          studyTime,
        },
        timestamp: finishTime,
        gradingResult,
        writingScore,
        writingAnswer,
        speakingEvaluation,
        grammarReadingBand,
        writingBand,
        speakingBand,
        overallBand,
      });

      for (const recipient of adminEmails) {
        await sendEmailWithPDF({
          accessToken: googleAccessToken,
          to: recipient,
          subject: `WeWIN IELTS Report - ${fullName} - Overall ${overallBand}`,
          html: emailHTML,
        });
      }

      emailSent = true;
      console.log("✅ Admin IELTS report email sent");
    } catch (err: any) {
      emailError = err.message || "Unknown email error";
      console.error("⚠️ Admin email sending failed:", emailError);
      warnings.push(`Không gửi được email admin: ${emailError}`);
    }

    // ---------------------------------------------------
    // 9. UPDATE FINAL LIST
    // ---------------------------------------------------
    console.log("💾 Updating Final_list...");
    try {
      await appendFinalList({
        accessToken: googleAccessToken,
        sheetId,
        id,
        name: fullName,
        email,
        score: overallBand,
        pdfUrl: "",
        writingBand,
        writingFeedback: [
          `Task: ${writingScore.taskAchievement}`,
          `Coherence: ${writingScore.coherenceCohesion}`,
          `Lexical: ${writingScore.lexicalResource}`,
          `Grammar: ${writingScore.grammaticalRange}`,
          `Suggestion: ${writingScore.suggestions}`,
        ].join("\n"),
        writingStatus: writingBand > 0 ? "DONE" : "ERROR_OR_PENDING",
        speakingBand: speakingBand || "",
        speakingPdf: "",
        overallBand,
        phone,
        consultant,
        ieltsNeed,
        selfScore,
        studyTime,
        startTime,
        finishTime,
        source: "next-api",
      });
      console.log("✅ Final_list updated");
    } catch (finalListError: any) {
      console.error("⚠️ Final_list update failed:", finalListError.message);
      // Don't fail the entire request
    }

    // ---------------------------------------------------
    // 10. RETURN SUCCESS RESPONSE
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      uuid,
      gradingResult,
      writingScore,
      writingAnswer,
      grammarReadingBand,
      writingBand,
      speakingBand,
      overallBand,
      speakingEvaluation,
      timestamp: finishTime,
      emailSent,
      emailError,
      warnings,
    });
  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
