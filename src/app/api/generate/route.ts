import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { transcript, platform, contentStyle } = await request.json();
    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }
    if (transcript.length > 20000) {
      return NextResponse.json(
        { error: "Transcript is too long. Maximum length is 20,000 characters." },
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
You are ClipForge, an expert short-form content strategist and viral video editor.

Your job is to analyze a long-form transcript and transform its strongest moments into high-retention short-form content specifically for ${platform}.

TRANSCRIPT:
CONTENT STYLE:
${contentStyle || "Viral"}

Adapt the entire output to this content style:
- Viral: prioritize scroll-stopping hooks, curiosity, tension, and retention.
- Educational: prioritize clarity, useful insights, actionable lessons, and easy-to-follow explanations.
- Storytelling: prioritize narrative, emotion, conflict, progression, and satisfying payoff.
- Sales: prioritize the problem, desire, benefits, objections, and persuasive messaging without sounding spammy.

Every hook, clip idea, caption, and script must reflect the selected content style.
${transcript}

First, deeply analyze the transcript internally. Identify:
- the strongest ideas, stories, opinions, surprises, mistakes, lessons, or emotional moments
- moments that can stand on their own without needing the full video
- statements that naturally create curiosity
- specific details, numbers, contrasts, or transformations
- parts most likely to make someone stop scrolling

Then create the content below.

HOOKS:
Create 5 distinct hooks.
Each hook should:
- be concise and immediately understandable
- create curiosity without clickbait or false claims
- use specific details from the transcript when possible
- sound natural when spoken aloud
- avoid generic phrases like "You won't believe this"
- use different psychological angles instead of rewriting the same hook 5 times

CLIP IDEAS:
Create 3 short-form video concepts based on the strongest parts of the transcript.
For each idea:
- explain exactly what moment or idea the clip should focus on
- suggest how the opening 1-3 seconds should work
- suggest useful visual or editing elements
- make the concept realistic to produce

CAPTIONS:
Create 3 captions suitable for ${platform}.
They should:
- sound human, not corporate
- complement the video instead of repeating the hook
- avoid excessive hashtags
- use hashtags only when genuinely useful

SCRIPT:
Create one complete 30-60 second short-form script based on the strongest angle in the transcript.
The script should:
- hook the viewer immediately
- maintain curiosity throughout
- remove unnecessary filler
- preserve the meaning of the original transcript
- end with a satisfying payoff or conclusion
- include short visual/editing directions where useful

IMPORTANT:
Never invent facts, numbers, experiences, or quotes that are not supported by the transcript.
Do not give generic content advice.
Do not explain your reasoning.
Return ONLY valid JSON.
Do not use markdown or code blocks.

Use exactly this JSON structure:

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
  "script": "complete short-form script"
}
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