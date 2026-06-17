/** HTO Ielts Test Management */
export const IELTS_SHEET_ID = "1g4ONkJOpxbUVTIPnpDXbVSB6K75z44f_GLNymTp6Zwo";

export const SHEET_TABS = {
  SPEAKING: "Speaking_list",
  LISTENING: "Listening_list",
  FINAL: "Final_list",
  ANSWERS: "Answers",
  GRAMMAR: "Grammar_list",
} as const;

export function getIeltsSheetId(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID ||
    process.env.GOOGLE_SHEETS_ID ||
    IELTS_SHEET_ID
  );
}

export function getCheckSheetId(): string {
  return getIeltsSheetId();
}
