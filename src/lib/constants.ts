/**
 * App-wide constants. These mirror the spec defaults but live in code so the
 * client never hardcodes magic numbers in the UI. Server-side policy (rate
 * limits, cooldowns) is enforced by the database / API, not here.
 */

export const ECO_POINTS_PER_DISPOSAL = 10;

/** Seconds before an unused disposal session expires (checked on read). */
export const SESSION_TTL_SECONDS = 300; // 5 minutes

/** Cooldown: a user cannot start a new session on the same bin within N minutes. */
export const SESSION_COOLDOWN_MINUTES = 10;

/** Max disposal sessions a single user may start per hour. */
export const MAX_SESSIONS_PER_HOUR = 10;

/** Max disposal sessions a single user may start per day. */
export const MAX_SESSIONS_PER_DAY = 20;

/** Environmental impact constants (per plastic bottle). From spec A14. */
export const IMPACT = {
  PLASTIC_GRAMS_PER_BOTTLE: 18,
  CO2E_GRAMS_PER_BOTTLE: 54,
} as const;

export const APP_NAME = "EcoP";
export const APP_TAGLINE = "Rewarding Sustainable Behaviour Through AI";

/** Routes used across the app. */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  LEADERBOARD: "/leaderboard",
  REWARDS: "/rewards",
  PROFILE: "/profile",
  BIN: (binId: string) => `/ecop/bin/${binId}`,
} as const;

/** Default leaderboard page size. */
export const LEADERBOARD_PAGE_SIZE = 20;
