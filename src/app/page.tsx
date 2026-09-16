"use client";

import { useState } from "react";

const platforms = ["TikTok", "Reels", "Shorts"] as const;

type Platform = (typeof platforms)[number];

type GeneratedContent = {
  hooks: string[];
  clips: string[];
  captions: string[];
  script: string;
};

const placeholders = {
  hooks:
    "Opening lines that stop the scroll will appear here once you generate content.",
  clips:
    "Short, high-retention clip concepts from your transcript will appear here.",
  captions:
    "Platform-ready captions and on-screen text suggestions will appear here.",
  script:
    "A tight 15–60 second script based on your transcript will appear here.",
};

function snippetFrom(transcript: string) {
  const cleaned = transcript.trim().replace(/\s+/g, " ");
  const words = cleaned.split(" ").slice(0, 8).join(" ");
  const opening = cleaned.length > 90 ? `${cleaned.slice(0, 90)}…` : cleaned;

  return { words, opening };
}

function generateMock(
  platform: Platform,
  transcript: string,
): GeneratedContent {
  const { words, opening } = snippetFrom(transcript);

  if (platform === "TikTok") {
    return {
      hooks: [
        `Stop scrolling if you just heard “${words}…”`,
        `Nobody talks about this part: ${words}.`,
        `This is the line that made the whole video hit: ${opening}`,
        `Wait for it — it starts with “${words}.”`,
        `If this sounded familiar, you needed this clip.`,
      ],
      clips: [
        `Open on the first sentence, then jump to the payoff around “${words}.” Keep it under 20 seconds.`,
        `Cut a reaction-style clip: text on screen quotes the transcript, then reveal the takeaway.`,
        `Use the opening as a voiceover while on-screen text lists 3 quick beats from the talk.`,
      ],
      captions: [
        `${words} — and it only gets better from here. #tiktok #fyp`,
        `The part you need to hear: ${opening}`,
        `Save this if you keep rewatching the start. “${words}”`,
      ],
      script: `Hook: “${words}…”\n\nBeat 1: Repeat the opening in one breath.\nBeat 2: Call out why it matters in 5 seconds.\nBeat 3: End on a question so people comment.\n\nOn-screen text: ${opening}`,
    };
  }

  if (platform === "Reels") {
    return {
      hooks: [
        `That moment when someone says “${words}…”`,
        `Save this Reel if this line hit: ${opening}`,
        `Soft open, hard point: ${words}.`,
        `You weren’t supposed to hear this part so clearly.`,
        `A quieter hook: “${words}” — then the reveal.`,
      ],
      clips: [
        `Carousel-style Reel: three frames, each pulling a phrase from “${words}.”`,
        `Aesthetic B-roll over the transcript opening, punch in on the key sentence.`,
        `Split the talk into a 15-second story: setup, tension, and the line that starts with “${words}.”`,
      ],
      captions: [
        `${opening} ✨\nWhich part are you taking with you?`,
        `For anyone who needed to hear: ${words}`,
        `Replay-worthy. Starts with “${words}.” #reels #content`,
      ],
      script: `Visual: slow push-in.\nVO: “${words}…”\n\nHold on the full opening: ${opening}\n\nClose with a save prompt and one clean takeaway on screen.`,
    };
  }

  return {
    hooks: [
      `Here’s the part of the video people will clip: “${words}”`,
      `Watch this if you skipped the intro. It starts with ${opening}`,
      `One idea, one Short: ${words}.`,
      `The thesis in a sentence: ${opening}`,
      `If you only remember one line, make it “${words}.”`,
    ],
    clips: [
      `Educational cut: state the problem, then quote “${words}” as the answer.`,
      `Chapter-style Short: title card, then 20 seconds from the transcript opening.`,
      `End-screen CTA after repeating the first idea in plainer words.`,
    ],
    captions: [
      `${opening}\nSubscribe for the next Short from this talk.`,
      `Key takeaway: ${words}`,
      `From the full video — clipped. “${words}” #shorts #youtube`,
    ],
    script: `TITLE: ${words}\n\n0–3s: Hook with the opening line.\n3–25s: Unpack ${opening}\n25–35s: Restate the takeaway and point viewers to the full video.`,
  };
}

function formatList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [platform, setPlatform] = useState<Platform>("TikTok");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedContent | null>(null);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = transcript.trim().length > 0 && !generating;
  async function handleFetchTranscript() {
    if (!youtubeUrl.trim() || fetchingTranscript) return;
  
    setFetchingTranscript(true);
    setError(null);
  
    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: youtubeUrl,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }
  
      setTranscript(data.transcript);
    } catch (error) {
      console.error("Transcript error:", error);
  
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch transcript"
      );
    } finally {
      setFetchingTranscript(false);
    }
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!transcript.trim() || generating) return;

  setGenerating(true);
  setError(null);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        platform,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Generation failed");
    }

    const data = await response.json();

    setResults({
      hooks: data.hooks,
      clips: data.clipIdeas,
      captions: data.captions,
      script: data.script,
    });
  } catch (error) {
    console.error("Generate error:", error);
    setError(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setGenerating(false);
  }
}

  async function copyText(card: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedCard(card);
    window.setTimeout(() => setCopiedCard(null), 1500);
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <p className="text-lg font-semibold tracking-tight text-white">
            ClipForge
          </p>
          <p className="max-w-[55%] text-right text-xs text-zinc-400 sm:max-w-none sm:text-sm">
            Turn long videos into short-form content.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            One video. A week of content.
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-400 sm:text-lg">
            Paste a transcript from a YouTube video, podcast, or stream. ClipForge
            turns it into short-form ideas for TikTok, Instagram Reels, and
            YouTube Shorts.
          </p>
        </section>

        <form className="mt-10 space-y-6" onSubmit={handleGenerate}>
        <div>
  <label
    htmlFor="youtubeUrl"
    className="mb-2 block text-sm font-medium text-zinc-300"
  >
    YouTube URL
  </label>

  <div className="flex gap-3">
    <input
      id="youtubeUrl"
      type="url"
      value={youtubeUrl}
      onChange={(event) => setYoutubeUrl(event.target.value)}
      placeholder="https://www.youtube.com/watch?v=..."
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none"
    />

    <button
      type="button"
      onClick={handleFetchTranscript}
      disabled={!youtubeUrl.trim() || fetchingTranscript}
      className="whitespace-nowrap rounded-xl bg-white px-5 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      {fetchingTranscript ? "Fetching..." : "Get transcript"}
    </button>
  </div>
</div>
          <div>
            <label
              htmlFor="transcript"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Video transcript
            </label>
            <textarea
              id="transcript"
              name="transcript"
              rows={10}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste your YouTube video, podcast, or stream transcript here..."
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm leading-6 text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
            <p className="mt-2 text-xs text-zinc-500">
              {transcript.length} characters
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">Platform</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((item) => {
                const selected = platform === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPlatform(item)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "bg-zinc-100 text-zinc-950"
                        : "border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canGenerate}
            className="w-full rounded-xl bg-zinc-100 px-5 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-zinc-100/40 disabled:text-zinc-500 disabled:hover:bg-zinc-100/40 sm:w-auto sm:min-w-56"
          >
            {generating ? "Generating..." : "Generate content"}
          </button>
          {error && (
  <p className="mt-3 text-sm text-red-400">
    {error}
  </p>
)}
        </form>

        <section className="mt-14">
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Results
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ResultCard
              title="Viral hooks"
              copied={copiedCard === "hooks"}
              onCopy={() =>
                results && copyText("hooks", formatList(results.hooks))
              }
              canCopy={Boolean(results)}
            >
              {results ? (
                <ol className="list-decimal space-y-2 pl-4 text-zinc-300">
                  {results.hooks.map((hook) => (
                    <li key={hook}>{hook}</li>
                  ))}
                </ol>
              ) : (
                placeholders.hooks
              )}
            </ResultCard>

            <ResultCard
              title="Clip ideas"
              copied={copiedCard === "clips"}
              onCopy={() =>
                results && copyText("clips", formatList(results.clips))
              }
              canCopy={Boolean(results)}
            >
              {results ? (
                <ol className="list-decimal space-y-2 pl-4 text-zinc-300">
                  {results.clips.map((clip) => (
                    <li key={clip}>{clip}</li>
                  ))}
                </ol>
              ) : (
                placeholders.clips
              )}
            </ResultCard>

            <ResultCard
              title="Captions"
              copied={copiedCard === "captions"}
              onCopy={() =>
                results && copyText("captions", formatList(results.captions))
              }
              canCopy={Boolean(results)}
            >
              {results ? (
                <ol className="list-decimal space-y-2 pl-4 whitespace-pre-line text-zinc-300">
                  {results.captions.map((caption) => (
                    <li key={caption}>{caption}</li>
                  ))}
                </ol>
              ) : (
                placeholders.captions
              )}
            </ResultCard>

            <ResultCard
              title="Short-form script"
              copied={copiedCard === "script"}
              onCopy={() => results && copyText("script", results.script)}
              canCopy={Boolean(results)}
            >
              {results ? (
                <p className="whitespace-pre-line text-zinc-300">
                  {results.script}
                </p>
              ) : (
                placeholders.script
              )}
            </ResultCard>
          </div>
        </section>
      </main>
    </div>
  );
}

function ResultCard({
  title,
  children,
  onCopy,
  canCopy,
  copied,
}: {
  title: string;
  children: React.ReactNode;
  onCopy: () => void;
  canCopy: boolean;
  copied: boolean;
}) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          className="rounded-md border border-zinc-800 px-2 py-1 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-3 text-sm leading-6 text-zinc-500">{children}</div>
    </article>
  );
}
