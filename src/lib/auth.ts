export const COOKIE_NAME = "wt_auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Routes that bring their own auth (Telegram secret header / Vercel cron
// bearer) or that must be reachable while logged out.
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/telegram", "/api/cron"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Single-password access (APP_PASSWORD). The cookie holds an HMAC keyed by the
 * password, never the password itself, so changing APP_PASSWORD logs out every
 * session. Uses Web Crypto so it also runs in the proxy.
 */
async function hmac(password: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Buffer.from(sig).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signSession(): Promise<string> {
  const password = process.env.APP_PASSWORD;
  if (!password) throw new Error("APP_PASSWORD is not set");
  return hmac(password, "weight-tracker-session");
}

export async function verifySession(value: string | undefined): Promise<boolean> {
  if (!value || !process.env.APP_PASSWORD) return false;
  try {
    return safeEqual(value, await signSession());
  } catch {
    return false;
  }
}

// Compare HMACs rather than raw strings so timing doesn't leak the length.
export async function checkPassword(candidate: string): Promise<boolean> {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;
  return safeEqual(await hmac(password, candidate), await hmac(password, password));
}
