export const MODELS = [
  { id: "gpt-5.4", label: "GPT-5.4", badge: "general" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", badge: "fast" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", badge: "default" },
  { id: "gpt-5.2-codex", label: "GPT-5.2 Codex", badge: null },
  { id: "gpt-5.2", label: "GPT-5.2", badge: null },
  { id: "gpt-5.1-codex-max", label: "GPT-5.1 Codex Max", badge: "peak" },
  { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", badge: null },
  { id: "gpt-5.1", label: "GPT-5.1", badge: null },
  { id: "gpt-5-codex", label: "GPT-5 Codex", badge: null },
  { id: "gpt-5-codex-mini", label: "GPT-5 Codex Mini", badge: "fast" },
  { id: "gpt-5", label: "GPT-5", badge: null },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
