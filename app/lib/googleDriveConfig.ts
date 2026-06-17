/** Shared Speaking folder: https://drive.google.com/drive/folders/1UkpgUNL9JAIQgT8Ph_fiKJZWDOztI0ai */
export const SPEAKING_DRIVE_FOLDER_ID = "1UkpgUNL9JAIQgT8Ph_fiKJZWDOztI0ai";

export function getSpeakingUploadFolderId(
  clientFolderId?: string | null
): string {
  return (
    clientFolderId ||
    process.env.GOOGLE_DRIVE_SPEAKING_FOLDER_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_DRIVE_SPEAKING_FOLDER_ID ||
    SPEAKING_DRIVE_FOLDER_ID
  );
}

export function getSpeakingReportFolderId(): string {
  return (
    process.env.GOOGLE_DRIVE_REPORT_FOLDER_ID ||
    "1DVnoOgCCqYv1lIT_1I10p9GPXNFYENS4"
  );
}
