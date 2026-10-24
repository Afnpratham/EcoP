import crypto from "node:crypto";

/**
 * Constant-time HMAC-SHA256 verification of a webhook body.
 *
 * Device gateway convention:
 *   Header  : X-Signature
 *   Format  : `sha256=<hex-digest>`
 *   Digest  : HMAC-SHA256(the provisioned per-device secret, rawBodyBytes)
 *
 * Returns true if the signature is well-formed AND matches the computed digest.
 */
export function verifySignature({
  signatureHeader,
  rawBody,
  secret,
}: {
  signatureHeader: string | null | undefined;
  rawBody: string | Buffer;
  secret: string;
}): boolean {
  if (!signatureHeader) return false;
  const trimmed = signatureHeader.trim();
  const prefix = "sha256=";
  if (!trimmed.startsWith(prefix)) return false;

  const provided = trimmed.slice(prefix.length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(provided)) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks.
  return crypto.timingSafeEqual(
    Buffer.from(provided, "hex"),
    Buffer.from(computed, "hex"),
  );
}

/** Compute a signature for controlled test/device clients. */
export function signBody(rawBody: string, secret: string): string {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(Buffer.from(rawBody))
    .digest("hex");
  return `sha256=${digest}`;
}
