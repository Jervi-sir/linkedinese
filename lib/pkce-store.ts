/**
 * In-memory store for pending OAuth PKCE state.
 * Keyed by `state` param; expires after 10 minutes.
 */

interface PendingAuth {
  verifier: string;
  expires: number;
}

const store = new Map<string, PendingAuth>();

export function setPkce(state: string, verifier: string) {
  store.set(state, { verifier, expires: Date.now() + 10 * 60 * 1000 });
}

export function getPkce(state: string): string | null {
  const entry = store.get(state);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    store.delete(state);
    return null;
  }
  store.delete(state); // one-time use
  return entry.verifier;
}
