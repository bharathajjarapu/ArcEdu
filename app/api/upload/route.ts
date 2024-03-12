import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import pdf from "pdf-parse-fork";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const data = await pdf(buffer);

    return NextResponse.json({
      text: data.text,
      pages: data.numpages,
      filename: file.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
