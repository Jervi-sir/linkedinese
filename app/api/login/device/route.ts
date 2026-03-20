import { NextRequest } from "next/server";
import { startDeviceFlow, pollDeviceToken, saveTokens } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/login/device — start device flow
export async function POST() {
  try {
    const flow = await startDeviceFlow();
    return Response.json(flow);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/login/device — poll for token
export async function PUT(req: NextRequest) {
  try {
    const { device_auth_id, user_code } = (await req.json()) as {
      device_auth_id: string;
      user_code: string;
    };
    const tokens = await pollDeviceToken(device_auth_id, user_code);
    if (!tokens) return Response.json({ pending: true });
    await saveTokens(tokens);
    return Response.json({ ok: true, account_id: tokens.account_id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
