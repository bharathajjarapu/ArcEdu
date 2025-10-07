import { NextRequest, NextResponse } from "next/server";
import { makeTitleFromNames, makeTitleFromText } from "@/lib/title";
import { asString, readJsonBody } from "@/lib/api/request";

export async function POST(request: NextRequest) {
  try {
    const { content } = await readJsonBody(request, 20_000);

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const title = Array.isArray(content)
      ? makeTitleFromNames(content.map((item) => asString(item, 500, "content", { trim: false })))
      : makeTitleFromText(asString(content, 2_000, "content", { trim: false }));

    return NextResponse.json({ title });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate title";
    const status = message.includes("Invalid") || message.includes("content") || message.includes("large")
      ? 400
      : 500;
    return NextResponse.json({ error: status === 400 ? message : "Failed to generate title" }, { status });
  }
}
