"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";

type AppStage = "booting" | "access" | "workspace";
type AccessMode = "idle" | "loading" | "browser";
type MessageRole = "user" | "assistant";

type StyleId = "story" | "authority" | "practical";
type ModelId = "gpt-5.4" | "gpt-5.4-mini" | "gpt-5.3-codex"
  | 'gpt-5.2-codex' | 'gpt-5.2'
  | 'gpt-5.1-codex-max' | 'gpt-5.1' | 'gpt-5.1-codex'
  | 'gpt-5-codex' | 'gpt-5-codex-mini' | 'gpt-5';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

interface LimitErrorData {
  type: string;
  message: string;
  plan_type: string;
  resets_at: number;
  resets_in_seconds: number;
}

interface RecognitionResultLike {
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<RecognitionResultLike> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const DEMO_SESSION_ID = "studio-demo";

const MODELS: Array<{ id: ModelId; label: string; detail: string }> = [
  { id: "gpt-5.4", label: "GPT-5.4", detail: "Best for richer positioning" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini", detail: "Fast iteration loop" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex", detail: "Sharper structural polish" },
  { id: "gpt-5.2-codex", label: "GPT-5.2 Codex", detail: "Balanced precision" },
  { id: "gpt-5.2", label: "GPT-5.2", detail: "Standard high-perf" },
  { id: "gpt-5.1-codex-max", label: "GPT-5.1 Codex Max", detail: "Peak technical depth" },
  { id: "gpt-5.1-codex", label: "GPT-5.1 Codex", detail: "Reliable technical writing" },
  { id: "gpt-5.1", label: "GPT-5.1", detail: "Stable generation" },
  { id: "gpt-5-codex", label: "GPT-5 Codex", detail: "Foundational technical" },
  { id: "gpt-5-codex-mini", label: "GPT-5 Codex Mini", detail: "Light technical polish" },
  { id: "gpt-5", label: "GPT-5", detail: "The standard" },
];

const STYLES: Array<{ id: StyleId; label: string; hint: string }> = [
  { id: "story", label: "Story", hint: "Reflective narrative" },
  { id: "authority", label: "Authority", hint: "Clear point of view" },
  { id: "practical", label: "Practical", hint: "Useful and actionable" },
];

function firstSentence(text: string) {
  return text
    .split(/[.!?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)[0] ?? text.trim();
}

function cleanIdea(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function formatTimeRemaining(seconds: number) {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins} min` : ''}`;
}

export default function Home() {
  const [stage, setStage] = useState<AppStage>("booting");
  const [accessMode, setAccessMode] = useState<AccessMode>("idle");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleId>("story");
  const [selectedModel, setSelectedModel] = useState<ModelId>("gpt-5.4");
  const [streaming, setStreaming] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<LimitErrorData | null>(null);

  const browserPollRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptBaseRef = useRef("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.content.trim()),
    [messages]
  );

  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const element = composerRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 320)}px`;
  }, [input]);

  const clearTimers = useCallback(() => {
    if (browserPollRef.current) {
      window.clearInterval(browserPollRef.current);
      browserPollRef.current = null;
    }
  }, []);

  const finishAccess = useCallback((newAccountId?: string | null) => {
    setAccountId(newAccountId || DEMO_SESSION_ID);
    setStage("workspace");
    setAccessMode("idle");
    setError(null);
    clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.authenticated) {
          finishAccess(data.account_id);
        } else {
          setStage("access");
        }
      } catch {
        setStage("access");
      }
    };

    const bootTimer = window.setTimeout(() => {
      checkAuth();
    }, 850);

    return () => window.clearTimeout(bootTimer);
  }, [finishAccess]);

  useEffect(() => {
    const recognitionFactory = (
      globalThis as typeof globalThis & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).SpeechRecognition ?? (
      globalThis as typeof globalThis & {
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      }
    ).webkitSpeechRecognition;

    if (!recognitionFactory) return;

    const recognition = new recognitionFactory();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      const nextValue = [transcriptBaseRef.current, transcript.trim()]
        .filter(Boolean)
        .join(transcriptBaseRef.current ? " " : "")
        .trim();

      setInput(nextValue);
    };

    recognition.onerror = (event) => {
      setListening(false);
      setError(
        event.error === "not-allowed"
          ? "Microphone access is blocked in this browser."
          : "Voice capture failed. You can keep typing instead."
      );
    };

    recognition.onend = () => {
      setListening(false);
      transcriptBaseRef.current = "";
    };

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (copyState !== "copied") return;
    const timeout = window.setTimeout(() => setCopyState("idle"), 1800);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  async function startBrowserAccess() {
    clearTimers();
    setError(null);
    setAccessMode("loading");

    try {
      const res = await fetch("/api/auth", { method: "POST" });
      const { url } = await res.json();
      if (!url) throw new Error("Could not construct auth URL");
      window.open(url, "_blank", "width=520,height=640");
      setAccessMode("browser");

      const intervalId = window.setInterval(async () => {
        try {
          const check = await fetch("/api/auth");
          const data = await check.json();
          if (data.authenticated) {
            window.clearInterval(intervalId);
            finishAccess(data.account_id);
          }
        } catch {
          // ignore network errors while polling
        }
      }, 2000);
      browserPollRef.current = intervalId;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      setAccessMode("idle");
    }
  }

  function toggleListening() {
    if (!recognitionRef.current || streaming) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      transcriptBaseRef.current = "";
      return;
    }

    setError(null);
    transcriptBaseRef.current = input.trim();
    setListening(true);
    recognitionRef.current.start();
  }

  async function sendDraft(text: string) {
    const idea = cleanIdea(text);
    if (!idea || streaming) return;

    clearTimers();
    setError(null);
    setLimitError(null);
    setCopyState("idle");
    setStreaming(true);
    setInput("");

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: idea };
    const assistantMessage: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages((current) => [...current, userMessage, assistantMessage]);

    let nextContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          style: selectedStyle,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        let message = "Unable to generate a draft.";
        try {
          const data = (await response.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch { }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("The chat response did not include a stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((entry) => entry.trim().startsWith("data:"));

          if (!line) continue;

          const payload = line.trim().slice(5).trim();

          if (payload === "[DONE]") {
            setStreaming(false);
            window.setTimeout(() => composerRef.current?.focus(), 80);
            return;
          }

          try {
            const data = JSON.parse(payload) as { text?: string };
            if (!data.text) continue;
            nextContent += data.text;

            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessage.id ? { ...message, content: nextContent } : message
              )
            );
          } catch {
            // Ignore malformed SSE payloads.
          }
        }
      }
    } catch (nextError: unknown) {
      if (!nextContent) {
        setMessages((current) => current.filter((message) => message.id !== assistantMessage.id));
      }

      const errorMessage = nextError instanceof Error ? nextError.message : "Unable to generate a draft.";

      if (errorMessage.includes("Codex API error 429:")) {
        try {
          const jsonStr = errorMessage.substring(errorMessage.indexOf("{"));
          const parsed = JSON.parse(jsonStr);
          if (parsed?.error?.type === "usage_limit_reached") {
            setLimitError(parsed.error);
          } else {
            setError(errorMessage);
          }
        } catch (e) {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setStreaming(false);
      window.setTimeout(() => composerRef.current?.focus(), 80);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendDraft(input);
    }
  }

  async function resetSession() {
    clearTimers();
    recognitionRef.current?.stop();

    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // Ignore cleanup error
    }

    setStage("access");
    setAccessMode("idle");
    setAccountId(null);
    setMessages([]);
    setInput("");
    setStreaming(false);
    setListening(false);
    setCopyState("idle");
    setError(null);
    setLimitError(null);
  }

  async function copyOutput() {
    if (!latestAssistant) return;
    await navigator.clipboard.writeText(latestAssistant.content);
    setCopyState("copied");
  }

  if (stage === "booting") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(197,128,55,0.18),_transparent_35%),linear-gradient(180deg,#f8f2ea_0%,#f7f4ef_48%,#efe6d9_100%)] px-6 py-16 text-foreground dark:bg-[radial-gradient(circle_at_top,_rgba(194,120,48,0.16),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(80,117,91,0.16),_transparent_35%),linear-gradient(180deg,#17120f_0%,#110e0c_52%,#0b0908_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(122,92,57,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(122,92,57,0.06)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 dark:bg-[linear-gradient(rgba(214,198,176,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(214,198,176,0.05)_1px,transparent_1px)]" />
        <div className="relative flex flex-col items-center gap-4 rounded-xl border border-black/5 bg-white/70 px-6 py-8 shadow-[0_30px_100px_rgba(90,61,27,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-black/45 dark:text-white/45">Linkedinese</div>
          <div className="flex gap-2">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary"
                style={{ animationDelay: `${dot * 0.15}s` }}
              />
            ))}
          </div>
          <p className="max-w-xs text-center text-sm leading-6 text-black/55 dark:text-white/60">
            Preparing workspace.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(194,120,48,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(121,157,127,0.2),_transparent_32%),linear-gradient(180deg,#f8f3ec_0%,#f2eadf_100%)] px-5 py-6 text-foreground sm:px-8 sm:py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(194,120,48,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(102,142,108,0.16),_transparent_28%),linear-gradient(180deg,#17120f_0%,#120f0d_48%,#0b0a09_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(96,72,45,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,72,45,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40 dark:bg-[linear-gradient(rgba(214,198,176,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(214,198,176,0.04)_1px,transparent_1px)]" />
      <div className="relative mx-auto flex min-h-[calc(97vh-3rem)] w-full max-w-7xl flex-col rounded-xl border border-black/8 bg-white/72 shadow-[0_28px_110px_rgba(77,53,24,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171311]/78 dark:shadow-[0_28px_110px_rgba(0,0,0,0.45)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 px-5 py-4 dark:border-white/10 ">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-black dark:text-white">Linkedinese Studio</h1>
            <ModeToggle />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 dark:text-white/55">
            {stage === "workspace" && accountId ? (
              <span className="rounded-full bg-primary/12 px-3 py-1.5 text-primary">
                Session {accountId.slice(0, 8)}
              </span>
            ) : null}
          </div>
        </header>

        {stage === "access" ? (
          <section className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md rounded-xl border border-black/8 bg-[#fbf8f3] p-6 shadow-sm dark:border-white/10 dark:bg-[#1c1714]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-black dark:text-white">Sign In</h2>
                <p className="mt-2 text-sm text-black/60 dark:text-white/60">Authorize with ChatGPT to write posts.</p>
              </div>

              <div className="mt-8">
                <Button
                  onClick={startBrowserAccess}
                  className="w-full"
                  size="lg"
                  disabled={accessMode !== "idle"}
                >
                  {accessMode === "idle" ? "Connect via Browser" : "Awaiting Authorization..."}
                </Button>

                {accessMode === "browser" && (
                  <Button
                    variant="ghost"
                    onClick={() => setAccessMode("idle")}
                    className="mt-2 w-full text-xs text-black/50 dark:text-white/50"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {error ? <p className="mt-4 text-center text-sm text-destructive">{error}</p> : null}
            </div>
          </section>
        ) : (
          <section className="grid flex-1 gap-4 px-4 py-4 lg:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-black/8 bg-[#1b1613] text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h3 className="text-lg font-semibold">Preview</h3>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-white hover:bg-white/10" onClick={() => setMessages([])}>
                    Clear
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-white hover:bg-white/10" onClick={copyOutput} disabled={!latestAssistant}>
                    {copyState === "copied" ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="secondary" size="sm" className="h-8 rounded-lg" onClick={resetSession}>
                    Logout
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-white/40">
                    Awaiting generation...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-xl p-4 ${message.role === "user" ? "ml-auto max-w-[85%] bg-[#7b4b22]" : "max-w-full bg-white/5"
                          }`}
                      >
                        <div className="mb-2 text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                          {message.role}
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/90">
                          {message.content || (streaming ? "Generating..." : "")}
                        </pre>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-xl border border-black/8 bg-[#fbf7f1] p-4 shadow-sm dark:border-white/10 dark:bg-[#1a1512]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 pb-4 dark:border-white/10">
                <h2 className="text-lg font-semibold text-black dark:text-white">Workspace</h2>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>{model.label}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4 flex flex-1 flex-col gap-4 lg:flex-row">
                <div className="flex flex-1 flex-col rounded-xl border border-black/8 bg-white p-4 shadow-inner dark:border-white/10 dark:bg-[#120f0d]">
                  <textarea
                    ref={composerRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Draft your thoughts here..."
                    className="min-h-[12rem] flex-1 resize-none bg-transparent text-sm leading-6 text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/30"
                    disabled={streaming}
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/8 pt-4 dark:border-white/10">
                    <Button
                      variant={listening ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleListening}
                      disabled={!voiceSupported || streaming}
                      className="rounded-lg"
                    >
                      {voiceSupported ? (listening ? "Stop Dictation" : "Dictate") : "Mic Unavailable"}
                    </Button>

                    <Button size="sm" onClick={() => sendDraft(input)} disabled={!input.trim() || streaming} className="rounded-lg">
                      {streaming ? "Generating..." : "Generate LinkedIn Post"}
                    </Button>
                  </div>
                </div>

                <aside className="lg:w-48">
                  <div className="rounded-xl border border-black/8 bg-white p-3 dark:border-white/10 dark:bg-[#120f0d]">
                    <div className="mb-2 text-xs font-semibold text-black/50 dark:text-white/50">Style</div>
                    <div className="space-y-1">
                      {STYLES.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.id)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${selectedStyle === style.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                            }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>

              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

              {limitError && (
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                  <div className="flex items-center gap-2 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Usage Limit Reached
                  </div>
                  <p className="text-sm leading-relaxed">{limitError.message}</p>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-red-500/5 p-3 text-xs">
                    <div>
                      <div className="mb-0.5 opacity-70">Plan Type</div>
                      <div className="font-medium capitalize">{limitError.plan_type}</div>
                    </div>
                    <div>
                      <div className="mb-0.5 opacity-70">Resets in</div>
                      <div className="font-medium">{formatTimeRemaining(limitError.resets_in_seconds)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
