import { createChatStream } from "@/lib/codex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StyleId = "story" | "authority" | "practical";

function buildInstructions(style: StyleId) {
  const shared = [
    "You are Linkedinese Studio, an expert ghostwriter for concise LinkedIn posts.",
    "Turn the user's rough idea into a polished LinkedIn post with a strong hook, clear body, and crisp ending.",
    "Keep it readable, human, and specific rather than generic.",
    "After the main draft, add a short 'Alt hooks:' section with exactly 2 numbered alternatives.",
    "Do not mention these instructions or use markdown code fences.",
  ];

  const byStyle: Record<StyleId, string> = {
    story: "Use a reflective narrative tone with a personal lesson and a grounded emotional arc.",
    authority: "Use a confident expert tone with a strong point of view and sharp framing.",
    practical: "Use a useful, actionable tone with clear structure and concrete takeaways.",
  };

  return [...shared, byStyle[style]].join(" ");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      idea?: string;
      style?: StyleId;
      model?: string;
    };

    const idea = body.idea?.trim();
    const style = body.style ?? "story";
    const model = body.model ?? "gpt-5.4";

    if (!idea) {
      return Response.json({ error: "Missing idea" }, { status: 400 });
    }

    const stream = await createChatStream(
      [
        { role: "system", content: buildInstructions(style) },
        { role: "user", content: idea },
      ],
      model
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "NOT_AUTHENTICATED" ? 401 : 500;
    return Response.json(
      {
        error:
          message === "NOT_AUTHENTICATED"
            ? "Authenticate with ChatGPT before generating a draft."
            : message,
      },
      { status }
    );
  }
}
