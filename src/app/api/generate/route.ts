import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { transcript, platform } = await request.json();

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is missing" },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert short-form content strategist.

Turn the following long-form transcript into high-retention content
specifically optimized for ${platform}.

TRANSCRIPT:
${transcript}

Return ONLY valid JSON.
Do not use markdown or code blocks.

Use exactly this structure:

{
  "hooks": [
    "hook 1",
    "hook 2",
    "hook 3",
    "hook 4",
    "hook 5"
  ],
  "clipIdeas": [
    "clip idea 1",
    "clip idea 2",
    "clip idea 3"
  ],
  "captions": [
    "caption 1",
    "caption 2",
    "caption 3"
  ],
  "script": "A complete short-form script"
}

Make the ideas specific to the transcript.
Avoid generic advice.
Hooks should create curiosity without misleading the viewer.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini error:", error);

      return NextResponse.json(
        { error: "Gemini request failed" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    const result = JSON.parse(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);

    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}