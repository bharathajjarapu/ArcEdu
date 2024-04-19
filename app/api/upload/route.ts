import { NextRequest, NextResponse } from "next/server";
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();

    return NextResponse.json({
      text: data.text,
      pages: data.total,
      filename: file.name,
    });
  } catch (error: any) {
    console.error("PDF parsing error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to parse PDF",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
