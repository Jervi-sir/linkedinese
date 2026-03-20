import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, tokensFromResponse, saveTokens, REDIRECT_URI } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Authorized</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: #0e0e10;
      color: #fbbf24;
      height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      text-align: center;
      padding: 3rem;
      border: 1px solid #28282f;
      border-radius: 12px;
      background: #141416;
    }
    h1 { font-size: 1.5rem; margin-bottom: .5rem; }
    p { color: #5c5850; font-size: .875rem; margin-top: .5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✓ Authorized</h1>
    <p>You can close this tab.</p>
    <p>Redirecting back to the app...</p>
  </div>
  <script>
    setTimeout(() => { try { window.close(); } catch {} }, 1000);
    setTimeout(() => { window.location.href = '/'; }, 1500);
  </script>
</body>
</html>`;

const ERROR_HTML = (msg: string) => `<!DOCTYPE html>
<html>
<head>
  <title>Auth Failed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: monospace;
      background: #0e0e10;
      color: #f87171;
      height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      text-align: center;
      padding: 3rem;
      border: 1px solid #3f1616;
      border-radius: 12px;
      background: #160e0e;
      max-width: 480px;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    code {
      display: block;
      background: #0a0808;
      padding: .75rem;
      border-radius: 6px;
      font-size: .8rem;
      color: #fca5a5;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorization Failed</h1>
    <code>${msg}</code>
  </div>
</body>
</html>`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const error = url.searchParams.get("error");
  if (error) {
    const desc = url.searchParams.get("error_description") || error;
    return new Response(ERROR_HTML(desc), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(ERROR_HTML("Missing code or state parameter"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("code_verifier")?.value;
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!verifier || state !== savedState) {
    return new Response(ERROR_HTML("Invalid or expired state. Please try logging in again."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Clear the cookies after reading
  cookieStore.delete("code_verifier");
  cookieStore.delete("oauth_state");

  try {
    const tokens = await exchangeCode(code, REDIRECT_URI, verifier);
    const store = tokensFromResponse(tokens);
    await saveTokens(store);

    return new Response(SUCCESS_HTML, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(ERROR_HTML(msg), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
