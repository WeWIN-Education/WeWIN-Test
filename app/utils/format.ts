// Chuyển yyyy-mm-dd ➝ dd/mm/yyyy
export function formatDate(date: Date | null): string {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// yyyy-mm-dd → dd/mm/yyyy
export function formatDateFromInput(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export const formatTimestamp = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
};

export function parseDate(value?: string): Date | null {
  if (!value) return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [d, m, y] = parts.map(Number);

  if (!d || !m || !y) return null;

  const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}`;
  const date = new Date(iso);

  return isNaN(date.getTime()) ? null : date;
}

export function toPureArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(u8.length);
  const view = new Uint8Array(buffer);
  view.set(u8);
  return buffer; // always pure ArrayBuffer (never SharedArrayBuffer)
}

export function encodeSubject(text: string) {
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}
