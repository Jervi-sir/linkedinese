export const MODELS = [
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", badge: "default" },
  { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", badge: null },
  { id: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini", badge: "fast" },
  { id: "gpt-5.4", label: "GPT-5.4", badge: "general" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", badge: "fast" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
