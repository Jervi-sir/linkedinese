import { ensureFreshToken, loadTokens, type TokenStore } from "./auth";
import { platform, release, arch } from "os";

const CODEX_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";
const VERSION = "0.1.0";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

import { MODELS, type ModelId } from "./models";
export { MODELS, type ModelId };

// ── Build request ─────────────────────────────────────────────────────────────

function buildHeaders(store: TokenStore): Headers {
  const h = new Headers();
  h.set("Content-Type", "application/json");
  h.set("Authorization", `Bearer ${store.access_token}`);
  h.set(
    "User-Agent",
    `opencode/${VERSION} (${platform()} ${release()}; ${arch()})`
  );
  h.set("originator", "opencode");
  if (store.account_id) h.set("ChatGPT-Account-Id", store.account_id);
  return h;
}

function buildBody(messages: Message[], model: string): string {
  const systemMessage =
    messages.find((m) => m.role === "system")?.content ||
    "You are a helpful assistant.";
  const inputMessages = messages.filter((m) => m.role !== "system");

  return JSON.stringify({
    model,
    instructions: systemMessage,
    input: inputMessages.map((m) => ({
      role: m.role,
      content: [{ type: "input_text", text: m.content }],
    })),
    stream: true,
    reasoning: { effort: "medium", summary: "auto" },
    tools: [],
    store: false,
  });
}

function extractDelta(event: unknown): string | null {
  const e = event as Record<string, unknown>;
  if (e.type === "response.output_text.delta") return (e.delta as string) ?? null;
  if (e.type === "content_block_delta")
    return ((e.delta as Record<string, string>)?.text) ?? null;
  const choice = (e.choices as Array<Record<string, unknown>>)?.[0];
  return (
    ((choice?.delta as Record<string, string>)?.content) ??
    (choice?.text as string) ??
    null
  );
}

// ── SSE streaming – returns a ReadableStream of SSE text for Next.js route ───

export async function createChatStream(
  messages: Message[],
  model = "gpt-5.3-codex"
): Promise<ReadableStream<Uint8Array>> {
  let store = await loadTokens();
  if (!store) throw new Error("NOT_AUTHENTICATED");
  store = await ensureFreshToken(store);

  const upstream = await fetch(CODEX_ENDPOINT, {
    method: "POST",
    headers: buildHeaders(store),
    body: buildBody(messages, model),
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    throw new Error(`Codex API error ${upstream.status}: ${body.slice(0, 300)}`);
  }

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (!upstream.body) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "No response body" })}\n\n`)
        );
        controller.close();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const event = JSON.parse(data);
              const delta = extractDelta(event);
              if (delta) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: delta })}\n\n`
                  )
                );
              }
            } catch {
              // malformed SSE line – skip
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}
