import OpenAI from "openai";

export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export function requireOpenAI(): OpenAI {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return openai;
}
