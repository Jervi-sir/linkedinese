import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

export const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const ISSUER = "https://auth.openai.com";
export const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:1455/auth/callback";

const TOKENS_DIR = join(homedir(), ".codex-chat");
const TOKENS_FILE = join(TOKENS_DIR, "tokens.json");

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TokenStore {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  account_id?: string;
}

export interface PkceCodes {
  verifier: string;
  challenge: string;
}

export interface TokenResponse {
  id_token?: string;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

interface IdTokenClaims {
  chatgpt_account_id?: string;
  organizations?: Array<{ id: string }>;
  "https://api.openai.com/auth"?: { chatgpt_account_id?: string };
}

// ── Persistence ───────────────────────────────────────────────────────────────

export async function loadTokens(): Promise<TokenStore | null> {
  try {
    if (!existsSync(TOKENS_FILE)) return null;
    return JSON.parse(await readFile(TOKENS_FILE, "utf-8")) as TokenStore;
  } catch {
    return null;
  }
}

export async function saveTokens(store: TokenStore): Promise<void> {
  if (!existsSync(TOKENS_DIR)) mkdirSync(TOKENS_DIR, { recursive: true });
  await writeFile(TOKENS_FILE, JSON.stringify(store, null, 2));
}

export async function clearTokens(): Promise<void> {
  try {
    await unlink(TOKENS_FILE);
  } catch { }
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

export async function generatePKCE(): Promise<PkceCodes> {
  const verifier = generateRandomString(43);
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return { verifier, challenge: base64UrlEncode(hash) };
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateState(): string {
  return base64UrlEncode(
    crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer
  );
}

// ── JWT parsing ───────────────────────────────────────────────────────────────

function parseJwtClaims(token: string): IdTokenClaims | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString());
  } catch {
    return undefined;
  }
}

export function extractAccountId(tokens: TokenResponse): string | undefined {
  for (const t of [tokens.id_token, tokens.access_token]) {
    if (!t) continue;
    const c = parseJwtClaims(t);
    if (!c) continue;
    const id =
      c.chatgpt_account_id ||
      c["https://api.openai.com/auth"]?.chatgpt_account_id ||
      c.organizations?.[0]?.id;
    if (id) return id;
  }
  return undefined;
}

// ── Build auth URL ────────────────────────────────────────────────────────────

export function buildAuthorizeUrl(
  redirectUri: string,
  pkce: PkceCodes,
  state: string
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    state,
    originator: "opencode",
  });
  return `${ISSUER}/oauth/authorize?${params}`;
}

// ── Token exchange & refresh ──────────────────────────────────────────────────

export async function exchangeCode(
  code: string,
  redirectUri: string,
  verifier: string
): Promise<TokenResponse> {
  const res = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const res = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

export async function ensureFreshToken(
  store: TokenStore
): Promise<TokenStore> {
  if (store.expires_at > Date.now() + 60_000) return store;
  const tokens = await refreshAccessToken(store.refresh_token);
  const updated: TokenStore = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    account_id: extractAccountId(tokens) ?? store.account_id,
  };
  await saveTokens(updated);
  return updated;
}

export function tokensFromResponse(tokens: TokenResponse): TokenStore {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    account_id: extractAccountId(tokens),
  };
}

// ── Device flow (headless) ────────────────────────────────────────────────────

export async function startDeviceFlow(): Promise<{
  device_auth_id: string;
  user_code: string;
  verification_uri: string;
  interval: number;
}> {
  const res = await fetch(`${ISSUER}/api/accounts/deviceauth/usercode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID }),
  });
  if (!res.ok) throw new Error("Failed to initiate device authorization");
  const data = (await res.json()) as {
    device_auth_id: string;
    user_code: string;
    interval: string;
  };
  return {
    device_auth_id: data.device_auth_id,
    user_code: data.user_code,
    verification_uri: `${ISSUER}/codex/device`,
    interval: Math.max(parseInt(data.interval) || 5, 1) * 1000 + 3000,
  };
}

export async function pollDeviceToken(
  device_auth_id: string,
  user_code: string
): Promise<TokenStore | null> {
  const res = await fetch(`${ISSUER}/api/accounts/deviceauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_auth_id, user_code }),
  });

  if (!res.ok) {
    if (res.status === 403 || res.status === 404) return null; // still pending
    throw new Error(`Device poll failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    authorization_code: string;
    code_verifier: string;
  };

  const tokenRes = await fetch(`${ISSUER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: data.authorization_code,
      redirect_uri: `${ISSUER}/deviceauth/callback`,
      client_id: CLIENT_ID,
      code_verifier: data.code_verifier,
    }).toString(),
  });

  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
  const tokens: TokenResponse = await tokenRes.json();
  return tokensFromResponse(tokens);
}
