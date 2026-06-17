import { NextResponse } from "next/server";
import { getOpenAI, requireOpenAI } from "@/app/lib/openai";
import { getFallbackSpeakingQuestions } from "@/app/constants/speaking";

export async function GET() {
  try {
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(getFallbackSpeakingQuestions());
    }

    const prompt = `
Generate a random IELTS Speaking test set (Level B1-B2).
Output strictly in valid JSON format only:
{
  "part1": [ "question1", "question2", "question3" ],
  "part2": {
    "topic": "string",
    "bullets": ["point1", "point2", "point3", "point4"],
    "followUp": "string"
  },
  "part3": {
    "reading": "short paragraph (2 sentences)",
    "questions": ["q1", "q2"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
    });

    const text = completion.choices[0].message?.content || "{}";
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ Error generating IELTS set:", error);
    return NextResponse.json(getFallbackSpeakingQuestions());
  }
}

// ============================================
// GPT chấm Writing 
// ============================================
interface WritingEvaluation {
  task: string;
  coherence: string;
  lexical: string;
  grammar: string;
  overall: number;
  suggestion: string;
}

/**
 * Evaluate IELTS Writing Task 2 essay using GPT-4o-mini
 * Returns bilingual feedback with alternating English/Vietnamese lines
 */
export async function evaluateWriting(
  essay: string
): Promise<WritingEvaluation> {
  const openai = requireOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an IELTS Writing examiner. You MUST output ONLY valid JSON with no markdown, no code blocks, no explanations.

CRITICAL FORMAT REQUIREMENT:
For each evaluation field (task, coherence, lexical, grammar, suggestion), you must provide feedback in BOTH English and Vietnamese using this EXACT pattern:

FIRST: Write ALL feedback points in English (multiple sentences)
THEN: Write ALL the same feedback points in Vietnamese (translations)

Structure:
English sentence 1. English sentence 2. English sentence 3.
Vietnamese sentence 1. Vietnamese sentence 2. Vietnamese sentence 3.

EACH LANGUAGE BLOCK must be on its OWN line - English block on line 1, Vietnamese block on line 2.

CORRECT FORMAT EXAMPLES:

Example 1 (Task Achievement):
"The essay does not fully address all parts of the prompt. The main ideas are present but need more development. Supporting examples would strengthen the response.
Bài luận không giải quyết đầy đủ tất cả các phần của đề bài. Các ý chính có mặt nhưng cần được phát triển thêm. Các ví dụ hỗ trợ sẽ làm mạnh thêm bài viết."

Example 2 (Coherence):
"The essay lacks clear paragraph structure. Ideas jump from one point to another without smooth transitions. Using linking words would improve flow.
Bài luận thiếu cấu trúc đoạn văn rõ ràng. Các ý tưởng nhảy từ điểm này sang điểm khác mà không có sự chuyển tiếp mượt mà. Sử dụng từ nối sẽ cải thiện độ mạch lạc."

Example 3 (Short feedback):
"Good vocabulary range with some minor errors.
Vốn từ vựng tốt với một số lỗi nhỏ.".
Các ví dụ hỗ trợ sẽ làm mạnh thêm bài viết."

Example 2 (Coherence):
"The essay lacks clear paragraph structure.
Bài luận thiếu cấu trúc đoạn văn rõ ràng.
Ideas jump from one point to another without smooth transitions.
Các ý tưởng nhảy từ điểm này sang điểm khác mà không có sự chuyển tiếp mượt mà."

WRONG FORMAT EXAMPLES (NEVER DO THIS):
❌ "The essay lacks structure.\nBài luận thiếu cấu trúc.\nMore organization needed.\nCần tổ chức tốt hơn."
❌ "1. The essay lacks structure\n1. Bài luận thiếu cấu trúc"
❌ "EN: The essay lacks structure | VI: Bài luận thiếu cấu trúc"
❌ "The essay lacks structure (Bài luận thiếu cấu trúc)"

✓ CORRECT: "The essay lacks structure. More organization needed.\nBài luận thiếu cấu trúc. Cần tổ chức tốt hơn."

ABSOLUTE RULES - VIOLATION MEANS FAILURE:
✓ DO: Write ALL English sentences together on the first line
✓ DO: Write ALL Vietnamese sentences together on the second line (separated by \n from English)
✓ DO: Make sure Vietnamese translations match the order and meaning of English sentences
✗ NEVER: Alternate line by line (English, Vietnamese, English, Vietnamese)
✗ NEVER: Mix English and Vietnamese on the same line
✗ NEVER: Use labels like "EN:", "VI:", "[English]", "[Vietnamese]"
✗ NEVER: Use bullet points (•, -, *) or numbered lists (1., 2.)
✗ NEVER: Put more than 2 lines total (1 English line + 1 Vietnamese line)

REQUIRED JSON STRUCTURE:
{
  "task": "English sentence 1. English sentence 2. English sentence 3.\nVietnamese sentence 1. Vietnamese sentence 2. Vietnamese sentence 3.",
  "coherence": "English feedback here. More English feedback.\nVietnamese feedback here. More Vietnamese feedback.",
  "lexical": "English analysis. Additional English points.\nPhân tích tiếng Việt. Các điểm bổ sung.",
  "grammar": "English evaluation. English suggestions.\nĐánh giá tiếng Việt. Gợi ý tiếng Việt.",
  "overall": 6.5,
  "suggestion": "English suggestions for improvement. Keep practicing.\nGợi ý cải thiện bằng tiếng Việt. Hãy tiếp tục luyện tập."
}

Evaluation criteria:
- task: Task Achievement (Band 0-9)
- coherence: Coherence & Cohesion (Band 0-9)
- lexical: Lexical Resource (Band 0-9)
- grammar: Grammatical Range & Accuracy (Band 0-9)
- overall: Overall band score (0-9, can be 0.5 increments like 6.5, 7.0)
- suggestion: Suggestions for improvement

Remember: Each field must contain EXACTLY 2 lines:
- Line 1: ALL English feedback (multiple sentences separated by periods or spaces)
- Line 2: ALL Vietnamese feedback (translations in same order)

NO alternating, NO mixing, NO labels, NO numbers.`,
      },
      {
        role: "user",
        content: `Evaluate this IELTS Writing Task 2 essay.

CRITICAL REMINDER: Each field must have EXACTLY 2 lines:
Line 1: All English feedback (sentence 1. sentence 2. sentence 3.)
Line 2: All Vietnamese feedback (câu 1. câu 2. câu 3.)

DO NOT alternate line by line. Group all English together, then all Vietnamese together.

Essay:
${essay}`,
      },
    ],
    temperature: 0.3,
  });

  const content = res.choices[0].message.content ?? "{}";

  try {
    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleanContent);

    // Validate response structure
    if (
      !parsed.task ||
      !parsed.coherence ||
      !parsed.lexical ||
      !parsed.grammar
    ) {
      throw new Error("Missing required fields in GPT response");
    }

    return parsed as WritingEvaluation;
  } catch (error) {
    console.error("❌ Failed to parse GPT response:", content);

    // Try to extract JSON from the response
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return parsed as WritingEvaluation;
      } catch {
        // Fall through to error response
      }
    }

    // Return error response with proper format
    return createErrorResponse();
  }
}

/**
 * Create error response with bilingual format
 */
function createErrorResponse(): WritingEvaluation {
  return {
    task: "Unable to evaluate the essay at this time. Please try again or contact support.\nKhông thể đánh giá bài luận lúc này. Vui lòng thử lại hoặc liên hệ hỗ trợ.",
    coherence:
      "System error occurred. Your essay has been saved.\nĐã xảy ra lỗi hệ thống. Bài luận của bạn đã được lưu lại.",
    lexical:
      "Evaluation service temporarily unavailable.\nDịch vụ đánh giá tạm thời không khả dụng.",
    grammar:
      "Please contact your consultant for manual review.\nVui lòng liên hệ tư vấn viên để được xem xét thủ công.",
    overall: 0,
    suggestion:
      "We apologize for the inconvenience. Your response has been recorded.\nChúng tôi xin lỗi vì sự bất tiện này. Phản hồi của bạn đã được ghi nhận.",
  };
}

/**
 * Validate if text follows English-first, Vietnamese-second format
 * (Optional - for debugging)
 */
export function validateGroupedFormat(text: string): boolean {
  const lines = text.split("\n").filter((line) => line.trim());

  // Should have exactly 2 lines: English line + Vietnamese line
  if (lines.length !== 2) {
    console.warn(`Expected 2 lines, got ${lines.length}`);
    return false;
  }

  const [englishLine, vietnameseLine] = lines;

  // Check line 1 is primarily English
  const hasEnglish = /[a-zA-Z]/.test(englishLine);
  const hasVietnameseInFirst =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      englishLine
    );

  // Check line 2 is primarily Vietnamese
  const hasVietnamese =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      vietnameseLine
    );

  if (!hasEnglish) {
    console.warn("Line 1 missing English characters:", englishLine);
    return false;
  }

  if (hasVietnameseInFirst) {
    console.warn(
      "Line 1 contains Vietnamese (should be English only):",
      englishLine
    );
    return false;
  }

  if (!hasVietnamese) {
    console.warn("Line 2 missing Vietnamese characters:", vietnameseLine);
    return false;
  }

  return true;
}

export async function analyzeNumerology(name: string, dob: string) {
  const prompt = `
Bạn là chuyên gia thần số học.

Hãy phân tích thần số học dựa trên:
- Họ tên: ${name}
- Ngày sinh: ${dob}

❗ TRẢ VỀ DUY NHẤT HTML, KHÔNG ĐƯỢC TRẢ JSON ❗
HTML phải có format:

<div>
  <h3>🔮 Phân tích thần số học</h3>

  <p><b>1. Chỉ số đường đời:</b> ...</p>
  <p><b>2. Tính cách nổi bật:</b> ...</p>
  <p><b>3. Điểm mạnh:</b> ...</p>
  <p><b>4. Khuyến nghị học tập:</b> ...</p>
</div>

Không thêm text ngoài HTML.
`;

  const openai = requireOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
  });

  return res.choices[0].message.content || "";
}

// ============================================
// Whisper → transcript
// ============================================
export async function transcribeAudio(file: File) {
  const openai = requireOpenAI();
  return await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });
}

// ============================================
// GPT chấm Speaking - FIXED VERSION (bilingual per line pair)
// ============================================
export async function evaluateSpeaking(transcript: string) {
  const openai = requireOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          You are an IELTS Writing examiner.

          You MUST respond ONLY with valid JSON.
          No text before or after the JSON.
          No markdown. No code blocks.

          ==============================
          BILINGUAL FORMAT — STRICT RULE
          ==============================

          For every field (task, coherence, lexical, grammar, suggestion):

          ✔ Return ONE STRING containing MULTIPLE LINES  
          ✔ Each PAIR of lines follows this exact rule:

          1️⃣ Line 1 → English sentence  
          2️⃣ Line 2 → Vietnamese translation of that sentence  

          ❌ NOT allowed:
          - English + Vietnamese in the SAME line
          - Labels like [EN], [VI], "English:", "Tiếng Việt:"
          - Bullet points, emojis, dashes, symbols

          Example (FORMAT ONLY, not content):

          "task": "The essay lacks clear development.\\nBài luận thiếu sự phát triển rõ ràng.\\nIdeas are not connected well.\\nCác ý không được liên kết tốt."

          STRICT JSON FORMAT:
          {
            "task": "line1\\nline2\\nline3\\nline4",
            "coherence": "line1\\nline2\\nline3\\nline4",
            "lexical": "line1\\nline2\\nline3\\nline4",
            "grammar": "line1\\nline2\\nline3\\nline4",
            "overall": 0–9 number,
            "suggestion": "line1\\nline2\\nline3\\nline4"
          }

          Rules:
          - English: academic, objective, examiner tone (2–3 sentences).
          - Vietnamese: natural, concise, translated exactly below each English sentence.
          - Use \\n for every line break.
          - No mixing languages in the same line.
          `,
      },
      {
        role: "user",
        content: `Evaluate this IELTS Speaking transcript and return ONLY JSON:

      Transcript:
      ${transcript}
      `,
      },
    ],
    temperature: 0.4,
  });

  const content = res.choices[0].message.content ?? "{}";

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("❌ Failed to parse GPT Speaking response:", content);

    const jsonMatch = content.match(/({[\\s\\S]*})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (_) {}
    }

    return {
      fluency: "Error",
      grammar: "Error",
      vocabulary: "Error",
      pronunciation: "Error",
      coherence: "Error",
      overall: 0,
      error: "Invalid JSON response",
    };
  }
}
