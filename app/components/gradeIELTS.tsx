// app/lib/gradeIelts.ts

export interface AnswerKeyRow {
  result: string;
  skill: string;
  point: number;
}

const normalize = (s: any) => String(s || "").trim().toLowerCase();
const toOpts = (s: any) =>
  String(s || "")
    .split(/[,/]/)
    .map(normalize)
    .filter(Boolean);

const isLetterOptions = (arr: string[]) =>
  arr.length > 0 && arr.every((x) => /^[a-e]$/i.test(x));

export function gradeIelts(responses: string[], key: AnswerKeyRow[]) {
  let grammar = 0;
  let reading = 0;

  for (let i = 0; i < key.length; i++) {
    let user = normalize(responses[i] || "");
    let ans = key[i]?.result || "";
    let skill = key[i]?.skill || "";
    let point = Number(key[i]?.point || 1);

    if (!ans) continue;

    const correctOpts = toOpts(ans);
    const ok = isLetterOptions(correctOpts)
      ? correctOpts.includes(user[0])
      : correctOpts.includes(user);

    if (ok) {
      if (skill.toLowerCase().includes("reading")) reading += point;
      else grammar += point;
    }
  }

  return {
    grammarScore: grammar,
    readingScore: reading,
    totalScore: grammar + reading,
  };
}
