import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { SHEET_TABS } from "@/app/lib/googleSheetsConfig";
import { getGoogleAccessToken } from "@/app/lib/googleServerAuth";

interface IeltsLogData {
  name?: string;
  email?: string;
  part1?: string;
  link1?: string;
  part2?: string;
  link2?: string;
  part3?: string;
  link3?: string;
  linkPdf?: string;
}

const SPEAKING_COLUMNS = 11;

function buildSpeakingRow(params: {
  timestamp: string;
  uuid: string;
  data: IeltsLogData;
  existing?: string[];
}) {
  const { timestamp, uuid, data, existing = [] } = params;

  return [
    existing[0] || timestamp,
    uuid,
    data.name || existing[2] || "",
    data.email || existing[3] || "",
    data.part1 || existing[4] || "",
    data.link1 || existing[5] || "",
    data.part2 || existing[6] || "",
    data.link2 || existing[7] || "",
    data.part3 || existing[8] || "",
    data.link3 || existing[9] || "",
    data.linkPdf || existing[10] || "",
  ].slice(0, SPEAKING_COLUMNS);
}

export async function POST(req: Request) {
  try {
    const {
      accessToken,
      sheetId,
      data,
      uuid,
    }: {
      accessToken?: string;
      sheetId: string;
      data: IeltsLogData;
      uuid?: string;
    } = await req.json();

    if (!sheetId || !data) {
      return NextResponse.json(
        { error: "Missing sheetId or data" },
        { status: 400 }
      );
    }

    const googleAccessToken = await getGoogleAccessToken(accessToken);
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    if (uuid) {
      const findUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${SHEET_TABS.SPEAKING}'!A:K?majorDimension=ROWS`;
      const findRes = await fetch(findUrl, {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (!findRes.ok) {
        throw new Error(await findRes.text());
      }

      const findJson = await findRes.json();
      const rows: string[][] = findJson.values || [];
      const rowIndex = rows.findIndex(
        (row, index) => index >= 2 && row[1] === uuid
      );

      if (rowIndex !== -1) {
        const sheetRow = rowIndex + 1;
        const range = `'${SHEET_TABS.SPEAKING}'!A${sheetRow}:K${sheetRow}`;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
        const updateRes = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [
              buildSpeakingRow({
                timestamp,
                uuid,
                data,
                existing: rows[rowIndex],
              }),
            ],
          }),
        });

        if (!updateRes.ok) {
          throw new Error(await updateRes.text());
        }

        return NextResponse.json({ success: true, uuid, updated: true });
      }
    }

    const newUUID = uuid || randomUUID();
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${SHEET_TABS.SPEAKING}'!A:K:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const appendRes = await fetch(appendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${googleAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          buildSpeakingRow({
            timestamp,
            uuid: newUUID,
            data,
          }),
        ],
      }),
    });

    if (!appendRes.ok) {
      throw new Error((await appendRes.text()) || "Failed to append Speaking_list");
    }

    return NextResponse.json({ success: true, uuid: newUUID, created: true });
  } catch (error: any) {
    console.error("Error logging Speaking_list:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
