#!/usr/bin/env node
/**
 * Standalone login helper (runs outside Next.js dev server)
 *
 * npm run login           — browser PKCE flow
 * npm run login:headless  — device flow
 * npm run logout          — clear tokens
 */

import {
  clearTokens,
  loadTokens,
  generatePKCE,
  generateState,
  buildAuthorizeUrl,
  exchangeCode,
  tokensFromResponse,
  saveTokens,
  startDeviceFlow,
  pollDeviceToken,
} from "./auth.js";
import { createServer } from "http";

const OAUTH_PORT = 1455;
const REDIRECT_URI = `http://localhost:${OAUTH_PORT}/auth/callback`;

const arg = process.argv[2];

if (arg === "--logout") {
  await clearTokens();
  console.log("✓ Logged out.");
  process.exit(0);
}

if (arg === "--headless") {
  console.log("\nStarting device authorization flow...");
  const flow = await startDeviceFlow();
  console.log(`\n  Visit:      ${flow.verification_uri}`);
  console.log(`  Enter code: ${flow.user_code}`);
  console.log("\nWaiting...");

  while (true) {
    await new Promise((r) => setTimeout(r, flow.interval));
    const tokens = await pollDeviceToken(flow.device_auth_id, flow.user_code);
    if (tokens) {
      await saveTokens(tokens);
      console.log(`\n✓ Logged in! Account: ${tokens.account_id ?? "unknown"}`);
      process.exit(0);
    }
  }
}

// Browser PKCE flow
console.log("\nStarting browser login...");
const pkce = await generatePKCE();
const state = generateState();
const authUrl = buildAuthorizeUrl(REDIRECT_URI, pkce, state);

const tokens = await new Promise<Awaited<ReturnType<typeof tokensFromResponse>>>(
  (resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${OAUTH_PORT}`);
      if (url.pathname !== "/auth/callback") {
        res.end("Not found");
        return;
      }

      const error = url.searchParams.get("error");
      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Authorization failed</h1><p>" + error + "</p>");
        server.close();
        reject(new Error(error));
        return;
      }

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      if (!code || returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h1>Invalid callback</h1>");
        server.close();
        reject(new Error("Invalid callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body style='font-family:monospace;background:#0e0e10;color:#fbbf24;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>" +
        "<div style='text-align:center'><h2>✓ Authorized</h2><p style='color:#9e9a90'>You can close this tab.</p></div></body></html>"
      );
      server.close();

      try {
        const tr = await exchangeCode(code, REDIRECT_URI, pkce.verifier);
        resolve(tokensFromResponse(tr));
      } catch (err) {
        reject(err);
      }
    });

    server.listen(OAUTH_PORT, () => {
      console.log(`\n  Open in browser:\n\n  ${authUrl}\n`);
    });
  }
);

await saveTokens(tokens);
console.log(`\n✓ Logged in! Account: ${tokens.account_id ?? "unknown"}`);
