/**
 * Verify a Cloudflare Turnstile response token with the siteverify API.
 * Returns false on network/parse failures so checkout can reject safely.
 */
export async function verifyTurnstileToken(secretKey: string, token: string, remoteip?: string) {
  const body = new URLSearchParams({
    secret: secretKey,
    response: token,
  });
  if (remoteip?.trim()) body.set("remoteip", remoteip.trim());

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: unknown };
    return result.success === true;
  } catch {
    return false;
  }
}
