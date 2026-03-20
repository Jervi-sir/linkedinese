import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  loadTokens,
  clearTokens,
  generatePKCE,
  generateState,
  buildAuthorizeUrl,
  REDIRECT_URI,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth — return auth status
export async function GET() {
  const store = await loadTokens();
  return Response.json({
    authenticated: !!store,
    account_id: store?.account_id ?? null,
    expires_at: store?.expires_at ?? null,
  });
}

// POST /api/auth — generate login URL
export async function POST(req: NextRequest) {
  const pkce = await generatePKCE();
  const state = generateState();

  const cookieStore = await cookies();
  cookieStore.set("code_verifier", pkce.verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const url = buildAuthorizeUrl(REDIRECT_URI, pkce, state);
  console.log("url:", JSON.stringify(url, null, 2));
  return Response.json({ url, redirect_uri: REDIRECT_URI });
}

// DELETE /api/auth — logout
export async function DELETE() {
  await clearTokens();
  return Response.json({ ok: true });
}
