// /app/api/numberlogy/route.ts
import { analyzeNumerologyHTML } from "./helpers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { fullName, birthDate } = await req.json();

    if (!fullName || !birthDate) {
      return Response.json(
        { success: false, error: "Missing fullName or birthDate" },
        { status: 400 }
      );
    }

    const html = await analyzeNumerologyHTML(fullName, birthDate);

    return Response.json({
      success: true,
      html,
    });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
