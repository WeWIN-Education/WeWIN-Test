const LOGO_URL =
  "https://wewin.edu.vn/wp-content/uploads/2023/07/Artboard-1-copy@1x-e1690017564880.png";

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

interface WritingScore {
  overallBand: number;
  taskAchievement: string;
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalRange: string;
  suggestions: string;
}

interface SpeakingEvaluation {
  status: "done" | "pending" | "error";
  overallBand: number;
  summary: string;
  fluencyCoherence: string;
  lexicalResource: string;
  grammaticalRangeAccuracy: string;
  pronunciation: string;
  recommendations: string;
  transcripts: Record<string, string>;
  wordCounts: Record<string, number>;
  warnings: string[];
}

interface AdminEmailParams {
  student: {
    fullName: string;
    birthDate?: string;
    location?: string;
    phone?: string;
    email: string;
    consultant?: string;
    ieltsNeed?: string;
    selfScore?: string;
    studyTime?: string;
  };
  timestamp: string;
  gradingResult: {
    correctCount: number;
    totalQuestions: number;
    totalScore: number;
    maxScore: number;
    skillStats: Record<string, SkillStats>;
    wrongAnswers: WrongAnswer[];
  };
  writingScore: WritingScore;
  writingAnswer: string;
  speakingEvaluation: SpeakingEvaluation;
  grammarReadingBand: number;
  writingBand: number;
  speakingBand: number;
  overallBand: number;
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(value: unknown) {
  return esc(value).replace(/\r?\n/g, "<br />");
}

function stripFeedbackLabel(value: string) {
  return value
    .replace(/^\s*(English|EN)\s*[:\-]\s*/i, "")
    .replace(/^\s*(Vietnamese|Tiếng Việt|Tieng Viet|VI)\s*[:\-]\s*/i, "")
    .trim();
}

function splitBilingual(value: unknown) {
  const raw = String(value ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) return { english: "", vietnamese: "" };

  const labeledMatch = raw.match(
    /(?:^|\n)\s*(?:Vietnamese|Tiếng Việt|Tieng Viet|VI)\s*[:\-]\s*/i
  );

  if (labeledMatch && labeledMatch.index !== undefined) {
    return {
      english: stripFeedbackLabel(raw.slice(0, labeledMatch.index).trim()),
      vietnamese: stripFeedbackLabel(raw.slice(labeledMatch.index).trim()),
    };
  }

  const blocks = raw.split(/\n+/).map(stripFeedbackLabel).filter(Boolean);
  if (blocks.length >= 2) {
    return {
      english: blocks[0],
      vietnamese: blocks.slice(1).join("\n\n"),
    };
  }

  return { english: raw, vietnamese: "" };
}

function bilingualBlock(value: unknown) {
  const parts = splitBilingual(value);
  if (!parts.english && !parts.vietnamese) {
    return `<div style="color:#64748b;">No feedback available.</div>`;
  }

  return `
    <div style="margin-top:6px;">
      ${
        parts.english
          ? `<div style="font-size:11px;font-weight:800;color:#8A5A1E;text-transform:uppercase;letter-spacing:.3px;">English</div>
             <div style="font-size:14px;line-height:1.55;color:#1F2937;margin-top:3px;">${nl2br(parts.english)}</div>`
          : ""
      }
      ${
        parts.vietnamese
          ? `<div style="font-size:11px;font-weight:800;color:#0E4BA9;text-transform:uppercase;letter-spacing:.3px;margin-top:10px;">Tiếng Việt</div>
             <div style="font-size:14px;line-height:1.55;color:#1F2937;margin-top:3px;">${nl2br(parts.vietnamese)}</div>`
          : ""
      }
    </div>`;
}

function band(value: number | string | undefined) {
  const n = Number(value || 0);
  return n > 0 ? n.toFixed(1) : "N/A";
}

function percent(value: number, max: number) {
  if (!max) return "0%";
  return `${Math.round((value / max) * 100)}%`;
}

function levelLabel(overallBand: number) {
  if (overallBand >= 7) return "Tốt - có thể định hướng mục tiêu cao";
  if (overallBand >= 5.5) return "Khá - cần củng cố để tăng band ổn định";
  if (overallBand >= 4) return "Nền tảng trung bình - cần lộ trình bổ sung";
  if (overallBand > 0) return "Nền tảng yếu - cần học lại căn bản";
  return "Chưa đủ dữ liệu";
}

function buildSkillRows(stats: Record<string, SkillStats>) {
  const rows = Object.entries(stats);
  if (rows.length === 0) {
    return `<tr><td colspan="4" style="padding:14px;color:#64748b;">Chưa có dữ liệu kỹ năng.</td></tr>`;
  }

  return rows
    .map(([skill, item]) => {
      const ratio = percent(item.totalPoint, item.max);
      return `
        <tr>
          <td style="padding:12px;border-top:1px solid #E6ECF5;">${esc(skill)}</td>
          <td style="padding:12px;border-top:1px solid #E6ECF5;text-align:center;">${item.correct}/${item.q}</td>
          <td style="padding:12px;border-top:1px solid #E6ECF5;text-align:center;">${item.totalPoint}/${item.max}</td>
          <td style="padding:12px;border-top:1px solid #E6ECF5;text-align:center;">${ratio}</td>
        </tr>`;
    })
    .join("");
}

function buildWrongRows(wrongAnswers: WrongAnswer[]) {
  if (wrongAnswers.length === 0) {
    return `<tr><td colspan="4" style="padding:14px;color:#047857;font-weight:700;">Không có câu sai trong phần chấm tự động.</td></tr>`;
  }

  return wrongAnswers
    .slice(0, 30)
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;border-top:1px solid #F3D2D2;text-align:center;color:#B91C1C;font-weight:700;">${item.q}</td>
          <td style="padding:10px;border-top:1px solid #F3D2D2;">${esc(item.correct)}</td>
          <td style="padding:10px;border-top:1px solid #F3D2D2;">${esc(item.user || "-")}</td>
          <td style="padding:10px;border-top:1px solid #F3D2D2;">${esc(item.skill)}</td>
        </tr>`
    )
    .join("");
}

function feedbackItem(title: string, value: unknown) {
  return `
    <div style="border-top:1px solid #E6ECF5;padding-top:12px;margin-top:12px;">
      <div style="font-size:14px;font-weight:800;color:#0E4BA9;">${esc(title)}</div>
      ${bilingualBlock(value)}
    </div>`;
}

function buildSpeakingTranscripts(evaluation: SpeakingEvaluation) {
  const parts = [
    ["Part 1", evaluation.transcripts.part1],
    ["Part 2", evaluation.transcripts.part2],
    ["Part 3", evaluation.transcripts.part3],
  ];

  return parts
    .map(
      ([label, text]) => `
        <div style="margin-top:10px;">
          <div style="font-weight:700;color:#0E4BA9;">${label}</div>
          <div style="font-size:13px;line-height:1.55;color:#334155;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:10px;">
            ${nl2br(text || "Không có transcript.")}
          </div>
        </div>`
    )
    .join("");
}

export function buildAdminIeltsEmailHTML(params: AdminEmailParams) {
  const {
    student,
    timestamp,
    gradingResult,
    writingScore,
    writingAnswer,
    speakingEvaluation,
    grammarReadingBand,
    writingBand,
    speakingBand,
    overallBand,
  } = params;

  const wrongCount = Math.max(
    gradingResult.totalQuestions - gradingResult.correctCount,
    0
  );
  const speakingWarnings = speakingEvaluation.warnings.length
    ? `<div style="margin-top:12px;color:#92400E;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px;">${nl2br(
        speakingEvaluation.warnings.join("\n")
      )}</div>`
    : "";

  return `
<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BAO CAO KET QUA KIEM TRA</title>
</head>
<body style="margin:0;background:#EEF4FB;font-family:Arial,'Helvetica Neue',sans-serif;color:#14213D;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#EEF4FB;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="920" cellpadding="0" cellspacing="0" role="presentation" style="width:920px;max-width:96%;background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #DCE7F4;box-shadow:0 12px 32px rgba(14,75,169,0.14);">
          <tr>
            <td style="background:#0E4BA9;padding:18px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="width:155px;vertical-align:middle;">
                    <img src="${LOGO_URL}" alt="WeWIN Education" style="display:block;width:135px;max-width:135px;border:0;" />
                  </td>
                  <td style="vertical-align:middle;color:#E4C28E;">
                    <div style="font-size:22px;font-weight:800;">BAO CAO KET QUA KIEM TRA</div>
                    <div style="font-size:12px;margin-top:5px;color:#F4E3C8;">WeWIN IELTS Placement Test</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="width:56%;vertical-align:top;padding-right:16px;">
                    <div style="border:1px solid #DCE7F4;border-radius:12px;padding:18px;background:#F8FBFF;">
                      <div style="font-size:16px;font-weight:800;color:#0E4BA9;margin-bottom:12px;">Thông tin học viên</div>
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;line-height:1.55;">
                        <tr><td style="color:#64748B;width:145px;">Họ tên</td><td><b>${esc(student.fullName)}</b></td></tr>
                        <tr><td style="color:#64748B;">Email</td><td>${esc(student.email)}</td></tr>
                        <tr><td style="color:#64748B;">Số điện thoại</td><td>${esc(student.phone || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Ngày sinh</td><td>${esc(student.birthDate || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Khu vực</td><td>${esc(student.location || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Tư vấn viên</td><td>${esc(student.consultant || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Nhu cầu IELTS</td><td>${esc(student.ieltsNeed || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Tự đánh giá</td><td>${esc(student.selfScore || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Thời gian học/tuần</td><td>${esc(student.studyTime || "-")}</td></tr>
                        <tr><td style="color:#64748B;">Thời gian nộp</td><td>${esc(timestamp)}</td></tr>
                      </table>
                    </div>
                  </td>
                  <td style="vertical-align:top;">
                    <div style="border:1px solid #E4C28E;border-radius:12px;padding:18px;background:#FFF8EF;">
                      <div style="font-size:16px;font-weight:800;color:#8A5A1E;margin-bottom:12px;">Tóm tắt tư vấn</div>
                      <div style="font-size:38px;line-height:1;font-weight:900;color:#0E4BA9;">${band(overallBand)}</div>
                      <div style="font-size:13px;color:#64748B;margin-top:5px;">Overall estimate</div>
                      <div style="margin-top:12px;font-size:14px;line-height:1.55;"><b>Mức hiện tại:</b> ${esc(levelLabel(overallBand))}</div>
                      <div style="margin-top:10px;font-size:14px;line-height:1.55;"><b>Ưu tiên tư vấn:</b> xem kỹ kỹ năng có band thấp nhất, sau đó đề xuất lộ trình theo mục tiêu IELTS của học viên.</div>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;">
                <tr>
                  <td style="width:25%;padding-right:10px;"><div style="background:#0E4BA9;color:white;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;color:#DCEBFF;">Listening/Reading</div><div style="font-size:26px;font-weight:900;color:#E4C28E;">${band(grammarReadingBand)}</div></div></td>
                  <td style="width:25%;padding-right:10px;"><div style="background:#174EA6;color:white;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;color:#DCEBFF;">Writing</div><div style="font-size:26px;font-weight:900;color:#E4C28E;">${band(writingBand)}</div></div></td>
                  <td style="width:25%;padding-right:10px;"><div style="background:#1D5CB8;color:white;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;color:#DCEBFF;">Speaking</div><div style="font-size:26px;font-weight:900;color:#E4C28E;">${band(speakingBand)}</div></div></td>
                  <td style="width:25%;"><div style="background:#E4C28E;color:#0E2A55;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:12px;">Tự động đúng/sai</div><div style="font-size:26px;font-weight:900;">${gradingResult.correctCount}/${gradingResult.totalQuestions}</div></div></td>
                </tr>
              </table>

              <div style="margin-top:22px;border:1px solid #DCE7F4;border-radius:12px;overflow:hidden;">
                <div style="background:#F3F7FF;color:#0E4BA9;font-weight:800;padding:12px 16px;">Listening & Reading - kết quả theo đáp án Google Sheet</div>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;">
                  <thead>
                    <tr style="background:#FAFCFF;color:#475569;">
                      <th align="left" style="padding:10px 12px;">Kỹ năng</th>
                      <th style="padding:10px 12px;">Đúng/Tổng</th>
                      <th style="padding:10px 12px;">Điểm</th>
                      <th style="padding:10px 12px;">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>${buildSkillRows(gradingResult.skillStats)}</tbody>
                </table>
                <div style="padding:12px 16px;background:#FBFDFF;font-size:13px;color:#475569;">
                  Tổng điểm tự động: <b>${gradingResult.totalScore}/${gradingResult.maxScore}</b>. Số câu sai: <b>${wrongCount}</b>.
                </div>
              </div>

              <div style="margin-top:22px;border:1px solid #F3D2D2;border-radius:12px;overflow:hidden;">
                <div style="background:#FFF1F2;color:#B91C1C;font-weight:800;padding:12px 16px;">Danh sách câu sai cần tư vấn thêm</div>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:13px;">
                  <thead>
                    <tr style="background:#FFF7F7;color:#7F1D1D;">
                      <th style="padding:10px;">Câu</th>
                      <th align="left" style="padding:10px;">Đáp án đúng</th>
                      <th align="left" style="padding:10px;">Học viên trả lời</th>
                      <th align="left" style="padding:10px;">Kỹ năng</th>
                    </tr>
                  </thead>
                  <tbody>${buildWrongRows(gradingResult.wrongAnswers)}</tbody>
                </table>
              </div>

              <div style="margin-top:22px;border:1px solid #DCE7F4;border-radius:12px;padding:16px;background:#FFFFFF;">
                <div style="font-size:18px;font-weight:900;color:#0E4BA9;">Writing - Band ${band(writingScore.overallBand)}</div>
                ${feedbackItem("Task Achievement", writingScore.taskAchievement)}
                ${feedbackItem("Coherence & Cohesion", writingScore.coherenceCohesion)}
                ${feedbackItem("Lexical Resource", writingScore.lexicalResource)}
                ${feedbackItem("Grammar", writingScore.grammaticalRange)}
                <div style="margin-top:14px;background:#ECFDF5;border-left:4px solid #10B981;border-radius:8px;padding:12px;">
                  <div style="font-size:14px;font-weight:800;color:#047857;">Suggestions</div>
                  ${bilingualBlock(writingScore.suggestions)}
                </div>
              </div>

              <div style="margin-top:22px;border:1px solid #DCE7F4;border-radius:12px;padding:16px;background:#F8FBFF;">
                <div style="font-size:16px;font-weight:800;color:#0E4BA9;margin-bottom:10px;">Bài Writing học viên đã nộp</div>
                <div style="font-size:13px;line-height:1.6;color:#334155;">${nl2br(writingAnswer || "Học viên chưa nộp bài Writing.")}</div>
              </div>

              <div style="margin-top:22px;border:1px solid #DCE7F4;border-radius:12px;padding:16px;background:#FFFFFF;">
                <div style="font-size:18px;font-weight:900;color:#0E4BA9;">Speaking - Band ${band(speakingEvaluation.overallBand)}</div>
                ${feedbackItem("Overall", speakingEvaluation.summary)}
                ${feedbackItem("Fluency & Coherence", speakingEvaluation.fluencyCoherence)}
                ${feedbackItem("Lexical Resource", speakingEvaluation.lexicalResource)}
                ${feedbackItem("Grammar", speakingEvaluation.grammaticalRangeAccuracy)}
                ${feedbackItem("Pronunciation", speakingEvaluation.pronunciation)}
                <div style="margin-top:14px;background:#FFF8EF;border-left:4px solid #E4C28E;border-radius:8px;padding:12px;">
                  <div style="font-size:14px;font-weight:800;color:#8A5A1E;">Recommendations for Office</div>
                  ${bilingualBlock(speakingEvaluation.recommendations)}
                </div>
                ${speakingWarnings}
              </div>

              <div style="margin-top:22px;border:1px solid #DCE7F4;border-radius:12px;padding:16px;background:#FFFFFF;">
                <div style="font-size:16px;font-weight:800;color:#0E4BA9;margin-bottom:10px;">Speaking transcript</div>
                ${buildSpeakingTranscripts(speakingEvaluation)}
              </div>

              <div style="margin-top:18px;padding:14px;border-radius:10px;background:#0E4BA9;color:#F4E3C8;font-size:12px;line-height:1.5;">
                Báo cáo này được tạo tự động từ WeWIN IELTS Test. Listening/Reading được chấm theo đáp án trong Google Sheet; Writing/Speaking được AI phân tích để hỗ trợ tư vấn ban đầu. Office nên dùng kết quả này như dữ liệu tham khảo trước khi trao đổi với phụ huynh/học viên.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
