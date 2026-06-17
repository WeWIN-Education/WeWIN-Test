// ===============================================
// AUDIO RECORDING HELPERS (Cross-platform iPhone + Android)
// ===============================================

import localforage from "localforage";

localforage.config({
  name: "WeWIN-IELTS",
  storeName: "speaking_audio",
});

export function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || "audio/webm";
}


export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
