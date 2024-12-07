import { NextRequest, NextResponse } from "next/server";
import { makeTitleFromNames, makeTitleFromText } from "@/lib/title";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const title = Array.isArray(content)
      ? makeTitleFromNames(content)
      : makeTitleFromText(String(content));

    return NextResponse.json({ title });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
