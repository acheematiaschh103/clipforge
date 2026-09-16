import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url?.trim()) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const items = await YoutubeTranscript.fetchTranscript(url);

    if (!items.length) {
      return NextResponse.json(
        { error: "No transcript found" },
        { status: 404 }
      );
    }

    const transcript = items
      .map((item) => item.text)
      .join(" ");

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("FULL TRANSCRIPT ERROR:", error);

    return NextResponse.json(
        {
          error: "Failed to fetch YouTube transcript",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
  }
}