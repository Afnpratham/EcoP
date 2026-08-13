import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { ECO_POINTS_PER_DISPOSAL } from "@/lib/constants";
import type {
  AchievementRow,
  ProfileRow,
  RewardRow,
  SessionRow,
  TransactionRow,
} from "@/types/database";

const STORE_PATH = path.join(process.cwd(), "data", "demo-store.json");
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
const COOLDOWN_MS = 4000;

export type DemoStoreData = {
  user: ProfileRow;
  rewards: RewardRow[];
  sessions: SessionRow[];
  transactions: TransactionRow[];
  achievements: AchievementRow[];
  disposals: Array<{
    id: string;
    session_id: string;
    user_id: string;
    bin_id: string;
    dustbin_id: string | null;
    points_awarded: number;
    verification_status: "verified";
    verification_payload: Record<string, unknown>;
    created_at: string;
  }>;
  redemptions: Array<{
    id: string;
    user_id: string;
    reward_id: string;
    points_spent: number;
    status: "pending";
    created_at: string;
  }>;
  detectionLock: {
    locked: boolean;
    cycleId: string | null;
    lockedAt: string | null;
    releaseAfter: string | null;
  };
};

export type DemoAwardInput = {
  binId?: string | null;
  dustbinId?: string | null;
  sessionId?: string | null;
  cycleId?: string | null;
  confidence?: number | null;
  source?: string | null;
  reset?: boolean;
  bottlePresent?: boolean;
};

let operation = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = operation.then(work, work);
  operation = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function nowIso() {
  return new Date().toISOString();
}

function uuid() {
  return crypto.randomUUID();
}

function defaultStore(): DemoStoreData {
  const createdAt = nowIso();

  return {
    user: {
      id: DEMO_USER_ID,
      full_name: "Demo User",
      email: "demo@ecop.local",
      role: "student",
      sap_id: "DEMO-001",
      avatar_url: null,
      eco_points: 0,
      created_at: createdAt,
    },
    rewards: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "EcoP Sticker Pack",
        description: "A set of campus sustainability stickers.",
        cost_points: 20,
        stock: 25,
        image_url: null,
        active: true,
        created_at: createdAt,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Campus Coffee Voucher",
        description: "Redeem a free coffee at the campus cafe.",
        cost_points: 50,
        stock: 12,
        image_url: null,
        active: true,
        created_at: createdAt,
      },
      {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Reusable Bottle",
        description: "A reusable water bottle from the sustainability desk.",
        cost_points: 100,
        stock: 8,
        image_url: null,
        active: true,
        created_at: createdAt,
      },
    ],
    sessions: [],
    transactions: [],
    achievements: [
      {
        id: "44444444-4444-4444-8444-444444444444",
        code: "FIRST_BOTTLE",
        name: "First Bottle",
        description: "Recycle your first plastic bottle.",
        icon: "Leaf",
        condition_type: "disposals",
        threshold: 1,
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        code: "ECO_BEGINNER",
        name: "Eco Beginner",
        description: "Complete 5 verified disposals.",
        icon: "Award",
        condition_type: "disposals",
        threshold: 5,
      },
      {
        id: "66666666-6666-4666-8666-666666666666",
        code: "POINT_PRO",
        name: "Point Pro",
        description: "Accumulate 100 Eco Points.",
        icon: "Star",
        condition_type: "points",
        threshold: 100,
      },
    ],
    disposals: [],
    redemptions: [],
    detectionLock: {
      locked: false,
      cycleId: null,
      lockedAt: null,
      releaseAfter: null,
    },
  };
}

async function readStoreUnlocked(): Promise<DemoStoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return { ...defaultStore(), ...JSON.parse(raw) } as DemoStoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial = defaultStore();
    await writeStoreUnlocked(initial);
    return initial;
  }
}

async function writeStoreUnlocked(data: DemoStoreData) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function getDemoStore() {
  return enqueue(() => readStoreUnlocked());
}

export function getDemoDashboardPayload() {
  return getDemoStore().then((store) => buildDemoDashboardPayload(store));
}

export function buildDemoDashboardPayload(store: DemoStoreData) {
  const totalBottles = store.disposals.length;
  const weeklyPoints: Record<string, number> = {};

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60_000);
    weeklyPoints[d.toISOString().slice(0, 10)] = 0;
  }

  for (const transaction of store.transactions) {
    if (transaction.type !== "earn") continue;
    const key = new Date(transaction.created_at).toISOString().slice(0, 10);
    if (key in weeklyPoints) weeklyPoints[key]! += transaction.amount;
  }

  return {
    profile: store.user,
    user: {
      name: store.user.full_name,
      email: store.user.email,
    },
    ecoPoints: store.user.eco_points,
    totalBottles,
    stats: {
      ecoPoints: store.user.eco_points,
      totalDisposals: totalBottles,
      totalSessions: store.sessions.length,
      rank: 1,
    },
    recentTransactions: store.transactions.slice(0, 10),
    recentActivities: store.disposals.slice(0, 10).map((disposal) => ({
      type: "Plastic bottle disposed correctly",
      points: disposal.points_awarded,
      timestamp: disposal.created_at,
      dustbinId: disposal.dustbin_id,
      verificationStatus: disposal.verification_status,
    })),
    achievements: store.achievements.map((achievement) => ({
      ...achievement,
      earned:
        achievement.condition_type === "disposals"
          ? totalBottles >= (achievement.threshold ?? Number.POSITIVE_INFINITY)
          : store.user.eco_points >= (achievement.threshold ?? Number.POSITIVE_INFINITY),
      earnedAt: null,
    })),
    recentSessions: store.sessions.slice(0, 5).map((session) => ({
      id: session.id,
      bin_id: session.bin_id,
      status: session.status,
      started_at: session.started_at,
      verified_at: session.verified_at,
    })),
    weeklyPoints: Object.entries(weeklyPoints).map(([date, points]) => ({
      date,
      points,
    })),
    redemption: {
      availablePoints: store.user.eco_points,
      sampleRewards: store.rewards.filter((reward) => reward.active).slice(0, 3),
    },
  };
}

export function awardDemoDisposal(input: DemoAwardInput) {
  return enqueue(async () => {
    const store = await readStoreUnlocked();
    const now = new Date();
    const releaseAfter = store.detectionLock.releaseAfter
      ? new Date(store.detectionLock.releaseAfter)
      : null;

    if (input.reset || input.bottlePresent === false) {
      store.detectionLock = {
        locked: false,
        cycleId: null,
        lockedAt: null,
        releaseAfter: null,
      };
      await writeStoreUnlocked(store);
      return {
        success: true,
        pointsAdded: 0,
        totalPoints: store.user.eco_points,
        message: "Detection cycle reset",
        duplicate: false,
        retryAfterMs: 0,
      };
    }

    const cycleId = input.cycleId ?? input.sessionId ?? null;
    const isSameCycle = Boolean(
      store.detectionLock.locked &&
        (cycleId
          ? store.detectionLock.cycleId === cycleId
          : store.detectionLock.cycleId !== null),
    );
    const cooldownActive = Boolean(releaseAfter && now < releaseAfter);

    if (store.detectionLock.locked && (isSameCycle || cooldownActive)) {
      return {
        success: false,
        pointsAdded: 0,
        totalPoints: store.user.eco_points,
        message: "Duplicate detection ignored during cooldown",
        duplicate: true,
        retryAfterMs: releaseAfter
          ? Math.max(0, releaseAfter.getTime() - now.getTime())
          : COOLDOWN_MS,
      };
    }

    const timestamp = now.toISOString();
    const sessionId = input.sessionId ?? uuid();
    const binId = input.binId ?? input.dustbinId ?? "BIN-014";
    const disposalId = uuid();
    const existingSession = store.sessions.find((session) => session.id === sessionId);

    store.user.eco_points += ECO_POINTS_PER_DISPOSAL;
    if (existingSession) {
      existingSession.status = "verified";
      existingSession.verified_at = timestamp;
      existingSession.bin_id = binId;
    } else {
      store.sessions.unshift({
        id: sessionId,
        user_id: store.user.id,
        bin_id: binId,
        status: "verified",
        started_at: timestamp,
        expires_at: new Date(now.getTime() + 5 * 60_000).toISOString(),
        verified_at: timestamp,
        created_at: timestamp,
      });
    }
    store.disposals.unshift({
      id: disposalId,
      session_id: sessionId,
      user_id: store.user.id,
      bin_id: binId,
      dustbin_id: input.dustbinId ?? binId,
      points_awarded: ECO_POINTS_PER_DISPOSAL,
      verification_status: "verified",
      verification_payload: {
        confidence: input.confidence ?? 0.96,
        source: input.source ?? "demo-awareness-engine",
        cycleId,
      },
      created_at: timestamp,
    });
    store.transactions.unshift({
      id: uuid(),
      user_id: store.user.id,
      type: "earn",
      amount: ECO_POINTS_PER_DISPOSAL,
      reference_id: sessionId,
      description: "Plastic bottle disposed correctly",
      created_at: timestamp,
    });
    store.detectionLock = {
      locked: true,
      cycleId: cycleId ?? sessionId,
      lockedAt: timestamp,
      releaseAfter: new Date(now.getTime() + COOLDOWN_MS).toISOString(),
    };

    await writeStoreUnlocked(store);

    return {
      success: true,
      pointsAdded: ECO_POINTS_PER_DISPOSAL,
      totalPoints: store.user.eco_points,
      totalBottles: store.disposals.length,
      message: "Bottle disposed correctly",
      duplicate: false,
      retryAfterMs: COOLDOWN_MS,
      activity: store.disposals[0],
    };
  });
}

export function startDemoSession(binId: string) {
  return enqueue(async () => {
    const store = await readStoreUnlocked();
    const timestamp = nowIso();
    const sessionId = uuid();
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

    store.sessions.unshift({
      id: sessionId,
      user_id: store.user.id,
      bin_id: binId,
      status: "pending",
      started_at: timestamp,
      expires_at: expiresAt,
      verified_at: null,
      created_at: timestamp,
    });

    await writeStoreUnlocked(store);

    return {
      sessionId,
      binId,
      status: "pending" as const,
      expiresAt,
    };
  });
}

export function redeemDemoReward(rewardId: string) {
  return enqueue(async () => {
    const store = await readStoreUnlocked();
    const reward = store.rewards.find((item) => item.id === rewardId && item.active);

    if (!reward) {
      return { success: false, status: "not_found", message: "Reward not found." };
    }
    if (reward.stock <= 0) {
      return { success: false, status: "out_of_stock", message: "Reward is out of stock." };
    }
    if (store.user.eco_points < reward.cost_points) {
      return {
        success: false,
        status: "insufficient_points",
        message: `You need ${reward.cost_points} points but only have ${store.user.eco_points}.`,
      };
    }

    const timestamp = nowIso();
    const redemptionId = uuid();
    reward.stock -= 1;
    store.user.eco_points -= reward.cost_points;
    store.redemptions.unshift({
      id: redemptionId,
      user_id: store.user.id,
      reward_id: reward.id,
      points_spent: reward.cost_points,
      status: "pending",
      created_at: timestamp,
    });
    store.transactions.unshift({
      id: uuid(),
      user_id: store.user.id,
      type: "redeem",
      amount: -reward.cost_points,
      reference_id: redemptionId,
      description: `Redeemed: ${reward.name}`,
      created_at: timestamp,
    });

    await writeStoreUnlocked(store);

    return {
      success: true,
      redemptionId,
      rewardId: reward.id,
      pointsSpent: reward.cost_points,
      newTotal: store.user.eco_points,
    };
  });
}
