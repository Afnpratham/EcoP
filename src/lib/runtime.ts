/** Demo is an explicit isolated runtime, never an error fallback. */
export function isDemoMode() {
  return process.env.ECOP_DEMO_MODE === "true";
}
export function safeRedirect(value: string | null, fallback = "/dashboard") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return fallback;
  return value;
}
