import localforage from "localforage";

const SESSION_KEYS = [
  "ielts_audio_base64",
  "ielts_audio_links",
  "ielts_audio_session",
  "ielts_finished",
  "ielts_uuid",
  "ielts_questions",
  "ielts_listening",
  "ielts_reading",
  "ielts_writingAnswer",
] as const;

export function getIeltsSessionId(): string | null {
  return localStorage.getItem("ielts_startAt");
}

export function bindAudioToCurrentSession(): void {
  const sessionId = getIeltsSessionId();
  if (sessionId) {
    localStorage.setItem("ielts_audio_session", sessionId);
  }
}

export function isAudioSessionValid(): boolean {
  const sessionId = getIeltsSessionId();
  const audioSession = localStorage.getItem("ielts_audio_session");
  return Boolean(sessionId && audioSession === sessionId);
}

export async function clearIeltsTestProgress(): Promise<void> {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));

  await Promise.all(
    [1, 2, 3].map((part) =>
      localforage.removeItem(`ielts_speaking_blob_${part}`)
    )
  );
}
