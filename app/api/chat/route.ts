import { NextRequest } from "next/server";
import { createChatStream, type Message } from "@/lib/codex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { idea, style, model } = await req.json();

    if (!idea) {
      return Response.json({ error: "Idea is required." }, { status: 400 });
    }

    const styleHints = {
      story: "Reflective narrative. Focus on a personal lesson, storytelling, and an unexpected truth.",
      authority: "Clear point of view. Focus on strong opinions, crisp structure, and commanding tone.",
      practical: "Useful and actionable. Focus on clear steps, frameworks, and immediate value.",
    };

    const hint = styleHints[style as keyof typeof styleHints] || styleHints.story;

    const systemPrompt = `You are an expert LinkedIn ghostwriter. 
Your goal is to turn a rough idea into a polished, engaging LinkedIn post.

Follow these rules:
1. Preserve the core lesson or idea.
2. Adopt a "${style}" tone: ${hint}
3. The post should have a structured flow (e.g. Hook, Frame, Takeaway, Close).
4. Provide 2 alternative hooks at the very bottom.
5. Do not use hashtags or emojis unless absolutely necessary.
6. Make it feel authentic, punchy, and not stereotypically AI-generated (avoid words like "delve", "testament", "tapestry").
7. Keep sentences relatively short and impactful.`;

    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please draft this idea into a LinkedIn post:\n\n${idea}` },
    ];

    const stream = await createChatStream(messages, model || "gpt-5.4");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    if (message.includes("NOT_AUTHENTICATED")) {
      return Response.json({ error: "Please authenticate with ChatGPT to use this feature." }, { status: 401 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
