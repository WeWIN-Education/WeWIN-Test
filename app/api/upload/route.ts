import { NextResponse } from "next/server";
import { getSpeakingUploadFolderId } from "@/app/lib/googleDriveConfig";
import { getGoogleAccessToken } from "@/app/lib/googleServerAuth";

async function uploadFileToDrive(params: {
  fileBuffer: Buffer;
  accessToken: string;
  mimeType: string;
  parents?: string[];
}) {
  const { fileBuffer, accessToken, mimeType, parents } = params;
  const cleanMime = mimeType || "audio/webm";
  const ext = cleanMime.includes("mp4") ? "m4a" : "webm";

  const metadata: Record<string, unknown> = {
    name: `IELTS_${Date.now()}.${ext}`,
    mimeType: cleanMime,
  };

  if (parents?.length) {
    metadata.parents = parents;
  }

  const boundary = "-------314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const close_delim = `\r\n--${boundary}--`;

  const body = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}`
    ),
    Buffer.from(`${delimiter}Content-Type: ${cleanMime}\r\n\r\n`, "utf8"),
    fileBuffer,
    Buffer.from(close_delim),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = await res.json();
  return { res, data };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    const accessToken = formData.get("accessToken") as string | null;
    const clientFolderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Thiếu file audio" },
        { status: 400 }
      );
    }

    const googleAccessToken = await getGoogleAccessToken(accessToken);
    const folderId = getSpeakingUploadFolderId(clientFolderId);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "audio/webm";

    const { res, data } = await uploadFileToDrive({
      fileBuffer,
      accessToken: googleAccessToken,
      mimeType,
      parents: [folderId],
    });

    if (!res.ok) {
      const permissionError =
        data?.error?.message?.includes(
          "Insufficient permissions for the specified parent"
        ) || data?.error?.reason === "insufficientParentPermissions";

      if (permissionError) {
        throw new Error(
          "Insufficient permissions for the specified parent. Tài khoản Google đăng nhập cần quyền Editor trên folder Speaking."
        );
      }
      throw new Error(data.error?.message || "Upload failed");
    }

    return NextResponse.json({ success: true, data, folderId });
  } catch (err: any) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
