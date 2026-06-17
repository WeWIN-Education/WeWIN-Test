// /app/api/numberlogy/helpers.ts
import { getOpenAI } from "@/app/lib/openai";

/* ============================================= */
/* GRADING LOGIC */
/* ============================================= */
export function gradeResponses(
  responses: string[],
  answerKey: { answers: string[]; skills: string[]; points: number[] }
) {
  const { answers, skills, points } = answerKey;
  const n = Math.min(responses.length, answers.length);

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

  const stats: any = {};
  let correct = 0;
  const wrong: any[] = [];
  let total = 0;

  for (let i = 0; i < n; i++) {
    const user = String(responses[i] || "").trim();
    const ans = String(answers[i] || "").trim();
    const skill = skills[i] || "Unknown";
    const point = points[i] || 1;

    if (!stats[skill])
      stats[skill] = { correct: 0, totalPoint: 0, max: 0, q: 0 };
    stats[skill].max += point;
    stats[skill].q++;

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
/* PARSE WRITING (GPT JSON) */
/* ============================================= */
export function parseWritingResponse(response: any) {
  try {
    if (typeof response === "object" && response !== null) {
      return {
        overallBand: response.overall || 0,
        taskAchievement: response.task || "",
        coherenceCohesion: response.coherence || "",
        lexicalResource: response.lexical || "",
        grammaticalRange: response.grammar || "",
        suggestions: response.suggestion || "",
      };
    }

    if (typeof response === "string") {
      return parseWritingResponse(JSON.parse(response));
    }
  } catch (err) {
    console.error("⚠️ Writing parse error:", err);
  }

  return {
    overallBand: 0,
    taskAchievement: "",
    coherenceCohesion: "",
    lexicalResource: "",
    grammaticalRange: "",
    suggestions: "Error evaluating writing",
  };
}

/* ============================================= */
/* GPT THẦN SỐ HỌC */
/* ============================================= */
export async function analyzeNumerologyHTML(
  fullName: string,
  birthDate: string
) {
  const prompt = `
Bạn là chuyên gia thần số học.
Hãy viết bản phân tích thần số học theo style sau:

- Dùng tone thân thiện, nhẹ nhàng
- Chia thành 3 mục lớn:
    1️⃣ Phân tích thần số học cơ bản
    2️⃣ Phong cách học tiếng Anh phù hợp
    3️⃣ Lời khuyên cụ thể
- Dùng HTML đơn giản (<div>, <p>, <ul>, <li>, <strong>, <h3>)
- KHÔNG được dùng markdown, KHÔNG được dùng \`\`\`

Thông tin:
- Họ tên: ${fullName}
- Ngày tháng năm sinh: ${birthDate}

Trả về CHỈ HTML.
`;

  try {
    const openai = getOpenAI();
    if (!openai) {
      return `
<div style="background:#fffbeb;padding:14px;border-radius:10px;border:1px solid #fde68a;color:#92400e;">
  Chưa cấu hình OPENAI_API_KEY — bỏ qua phân tích thần số học.
</div>`;
    }

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    let html = res.choices[0].message.content?.trim() || "";

    // Nếu GPT trả về ```html ...``` thì bóc ra
    const match = html.match(/```(?:html)?([\s\S]*?)```/i);
    if (match) {
      html = match[1].trim();
    }

    // Template UI final
    return `
<div style="
  background:#f0fdf4;
  border-radius:12px;
  padding:22px 26px;
  font-size:14px;
  line-height:1.7;
  color:#111;
">
  <h3 style="margin:0 0 16px;color:#0E4BA9;font-size:17px;font-weight:700;">
    🔮 Phân tích thần số học & định hướng học tập
  </h3>

  ${html}
</div>`;
  } catch (err: any) {
    return `
<div style="
  background:#fef2f2;
  padding:14px;
  border-radius:10px;
  border:1px solid #fecaca;
  color:#b91c1c;
">
  Lỗi phân tích thần số học: ${err.message}
</div>`;
  }
}
