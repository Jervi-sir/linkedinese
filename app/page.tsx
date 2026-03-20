"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";

type AppStage = "booting" | "access" | "workspace";
type AccessMode = "idle" | "loading" | "browser";
type MessageRole = "user" | "assistant";

type StyleId = "story" | "authority" | "practical";
type ModelId = "gpt-5.4" | "gpt-5.4-mini" | "gpt-5.3-codex";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
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
];

const STYLES: Array<{ id: StyleId; label: string; hint: string }> = [
  { id: "story", label: "Story", hint: "Reflective narrative" },
  { id: "authority", label: "Authority", hint: "Clear point of view" },
  { id: "practical", label: "Practical", hint: "Useful and actionable" },
];

const SUGGESTIONS = [
  "We stopped obsessing over volume and started learning from five real customer calls a week.",
  "AI did not replace my writing process. It gave structure to thoughts I was already struggling to shape.",
  "Our launch looked smooth online, but the biggest lesson came from what broke behind the scenes.",
  "Turn a rough founder lesson into a short LinkedIn post that feels honest, sharp, and human.",
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

  const browserPollRef = useRef<number | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptBaseRef = useRef("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && message.content.trim()),
    [messages]
  );

  const voiceSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      (
        window as Window & {
          SpeechRecognition?: SpeechRecognitionCtor;
          webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
      ).SpeechRecognition ||
      (
        window as Window & {
          webkitSpeechRecognition?: SpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition
    );
  }, []);

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
        } catch (err) {
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
        } catch {}
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
      setError(nextError instanceof Error ? nextError.message : "Unable to generate a draft.");
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
    } catch (err) {
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
        <div className="relative flex flex-col items-center gap-6 rounded-[2rem] border border-black/5 bg-white/70 px-10 py-12 shadow-[0_30px_100px_rgba(90,61,27,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
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
            Loading the access gate, drafting workspace, and preview logic from the reference flow.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(194,120,48,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(121,157,127,0.2),_transparent_32%),linear-gradient(180deg,#f8f3ec_0%,#f2eadf_100%)] px-5 py-6 text-foreground sm:px-8 sm:py-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(194,120,48,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(102,142,108,0.16),_transparent_28%),linear-gradient(180deg,#17120f_0%,#120f0d_48%,#0b0a09_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(96,72,45,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(96,72,45,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40 dark:bg-[linear-gradient(rgba(214,198,176,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(214,198,176,0.04)_1px,transparent_1px)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col rounded-[2rem] border border-black/8 bg-white/72 shadow-[0_28px_110px_rgba(77,53,24,0.14)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171311]/78 dark:shadow-[0_28px_110px_rgba(0,0,0,0.45)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/8 px-5 py-5 dark:border-white/10 sm:px-8">
          <div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.38em] text-black/40 dark:text-white/40">Workflow-first writer</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black dark:text-white sm:text-3xl">Linkedinese Studio</h1>
            <ModeToggle />

          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 dark:text-white/55">
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/6">Access gate</span>
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/6">Idea composer</span>
            <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/6">Live preview</span>
            {stage === "workspace" && accountId ? (
              <span className="rounded-full bg-primary/12 px-3 py-1.5 text-primary">
                Session {accountId.slice(0, 8)}
              </span>
            ) : null}
          </div>
        </header>

        {stage === "access" ? (
          <section className="grid flex-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/45 dark:border-white/10 dark:bg-white/6 dark:text-white/45">
                Reference logic translated
              </div>
              <div className="space-y-4">
                <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-black dark:text-white sm:text-5xl">
                  Start with access, then move into a guided drafting workflow.
                </h2>
                <p className="max-w-xl text-base leading-8 text-black/60 dark:text-white/65 sm:text-lg">
                  I kept the original app logic: boot check, browser auth gate, session unlock, a structured prompt workspace,
                  style controls, and a live draft preview. The visuals are new, but the product flow is the same.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-black/60 dark:text-white/65 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/35 dark:text-white/35">01</div>
                  <p className="mt-3 leading-6">Resolve browser authentication before showing the workspace.</p>
                </div>
                <div className="rounded-[1.4rem] border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/35 dark:text-white/35">02</div>
                  <p className="mt-3 leading-6">Capture a rough thought, optionally by voice.</p>
                </div>
                <div className="rounded-[1.4rem] border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/6">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/35 dark:text-white/35">03</div>
                  <p className="mt-3 leading-6">Stream a polished LinkedIn-ready draft into preview.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/8 bg-[#fbf8f3] p-6 shadow-[0_24px_80px_rgba(86,60,30,0.1)] dark:border-white/10 dark:bg-[#1c1714] dark:shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/35 dark:text-white/35">Unlock workspace</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-black dark:text-white">Authenticate with ChatGPT</h3>
                </div>
                <div className="rounded-full bg-emerald-950 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/85">
                  Browser flow
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <button
                  type="button"
                  onClick={startBrowserAccess}
                  className="rounded-[1.5rem] border border-black/10 bg-white px-5 py-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/7 dark:hover:bg-white/10"
                >
                  <div className="text-sm font-semibold text-black dark:text-white">Browser flow</div>
                  <p className="mt-2 text-sm leading-6 text-black/55 dark:text-white/60">
                    Connect securely using the ChatGPT browser popup.
                  </p>
                </button>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/12 bg-white/80 p-5 text-sm leading-6 text-black/60 dark:border-white/12 dark:bg-white/6 dark:text-white/60">
                {accessMode === "idle" && "Select a connection method to authorize with ChatGPT."}
                {accessMode === "loading" && "Preparing popup..."}
                {accessMode === "browser" && "Awaiting callback from ChatGPT. You can close the popup once authorized."}
              </div>

              {accessMode === "browser" ? (
                <div className="mt-5 rounded-[1.75rem] bg-[#1f2c25] p-6 text-white shadow-inner">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-white/55">Popup status</div>
                  <div className="mt-4 text-2xl font-semibold tracking-[-0.03em]">Awaiting authorization</div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                    Please complete the login in the pop-up window. This page will automatically unlock once successful.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      className="rounded-full border-white/15 bg-white/5 px-5 text-white hover:bg-white/10"
                      onClick={() => setAccessMode("idle")}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}

              {error ? <p className="mt-5 text-sm text-destructive">{error}</p> : null}
            </div>
          </section>
        ) : (
          <section className="grid flex-1 gap-6 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="flex min-h-0 flex-col rounded-[1.8rem] border border-black/8 bg-[#fbf7f1] p-5 shadow-[0_18px_70px_rgba(90,61,27,0.08)] dark:border-white/10 dark:bg-[#1a1512] dark:shadow-[0_18px_70px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/8 pb-6 dark:border-white/10">
                <div className="max-w-2xl">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/38 dark:text-white/38">Workspace</div>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black dark:text-white sm:text-4xl">
                    Turn a rough idea into a post that feels ready to publish.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-black/60 dark:text-white/65 sm:text-base">
                    The page keeps the original workflow logic: quick-start prompts, style selection, voice capture when available,
                    model choice, live output streaming, copy-ready preview, and a resettable session.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setSelectedModel(model.id)}
                      className={`rounded-full border px-4 py-2 text-left text-xs transition ${selectedModel === model.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-black/10 bg-white text-black/60 hover:bg-white/70 dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12"
                         }`}
                    >
                      <div className="font-semibold">{model.label}</div>
                      <div className="mt-0.5 text-[0.68rem] opacity-75">{model.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-left text-xs leading-5 text-black/65 transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/8 dark:text-white/70 dark:hover:bg-white/12"
                  >
                    {firstSentence(suggestion)}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="flex min-h-[24rem] flex-col rounded-[1.7rem] border border-black/8 bg-white p-5 shadow-inner dark:border-white/10 dark:bg-[#120f0d]">
                  <textarea
                    ref={composerRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Drop in a rough thought, a lesson, a contrarian opinion, or a half-finished sentence..."
                    className="min-h-[16rem] flex-1 resize-none bg-transparent text-base leading-8 text-black outline-none placeholder:text-black/25 dark:text-white dark:placeholder:text-white/25 sm:text-lg"
                    disabled={streaming}
                  />

                  <div className="mt-5 flex flex-col gap-3 border-t border-black/8 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-black/55 dark:text-white/55">
                      <Button
                        variant={listening ? "destructive" : "outline"}
                        className="rounded-full px-4"
                        onClick={toggleListening}
                        disabled={!voiceSupported || streaming}
                      >
                        {voiceSupported ? (listening ? "Stop dictation" : "Dictate idea") : "Mic unavailable"}
                      </Button>
                      <span className="rounded-full bg-black/4 px-3 py-1.5 dark:bg-white/8">
                        {listening ? "Listening..." : "Press Enter to generate"}
                      </span>
                    </div>

                    <Button className="rounded-full px-5" onClick={() => sendDraft(input)} disabled={!input.trim() || streaming}>
                      {streaming ? "Streaming draft..." : "Polish post"}
                    </Button>
                  </div>
                </div>

                <aside className="space-y-4">
                    <div className="rounded-[1.5rem] border border-black/8 bg-white p-4 dark:border-white/10 dark:bg-[#120f0d]">
                     <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-black/35 dark:text-white/35">Post style</div>
                     <div className="mt-4 space-y-2">
                       {STYLES.map((style) => (
                         <button
                          key={style.id}
                          type="button"
                          onClick={() => setSelectedStyle(style.id)}
                          className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${selectedStyle === style.id
                            ? "border-primary bg-primary/10"
                            : "border-black/8 bg-[#fbf7f1] hover:bg-[#f6efe4] dark:border-white/10 dark:bg-white/6 dark:hover:bg-white/10"
                             }`}
                          >
                            <div className="text-sm font-semibold text-black dark:text-white">{style.label}</div>
                            <div className="mt-1 text-xs text-black/50 dark:text-white/50">{style.hint}</div>
                          </button>
                        ))}
                      </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-black/8 bg-[#223126] p-4 text-white">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-white/50">Workflow rules</div>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-white/78">
                      <p>1. Capture the raw idea before editing it.</p>
                      <p>2. Pick the framing mode that matches the angle.</p>
                      <p>3. Generate one primary draft plus alternate hooks.</p>
                    </div>
                  </div>
                </aside>
              </div>

              {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
            </div>

            <div className="flex min-h-0 flex-col rounded-[1.8rem] border border-black/8 bg-[#1b1613] text-white shadow-[0_18px_70px_rgba(32,22,14,0.25)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-6">
                <div>
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-white/45">Draft preview</div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Live output panel</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full border-white/15 bg-white/5 px-4 text-white hover:bg-white/10" onClick={() => setMessages([])}>
                    Clear
                  </Button>
                  <Button variant="outline" className="rounded-full border-white/15 bg-white/5 px-4 text-white hover:bg-white/10" onClick={copyOutput} disabled={!latestAssistant}>
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </Button>
                  <Button className="rounded-full bg-white px-4 text-black hover:bg-white/90" onClick={resetSession}>
                    Logout
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-[26rem] items-center justify-center">
                    <div className="max-w-md rounded-[1.8rem] border border-white/10 bg-white/5 p-8 text-center">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-white/40">Waiting for first draft</div>
                      <p className="mt-4 text-base leading-8 text-white/70">
                        The preview remains empty until the composer receives an idea. Once you submit, the draft streams in here,
                        mirroring the split between workspace and preview from the reference app.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pb-10">
                    {messages.map((message) => (
                      <article
                        key={message.id}
                        className={`rounded-[1.5rem] px-5 py-4 ${message.role === "user" ? "ml-auto max-w-[85%] bg-[#7b4b22] text-white" : "max-w-full bg-white/6 text-white/88"
                          }`}
                      >
                        <div className="text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-white/45">
                          {message.role === "user" ? "Input" : "Output"}
                        </div>
                        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-7">{message.content || (streaming ? "Building draft..." : "")}</pre>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
