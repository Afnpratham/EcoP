/**
 * Supabase generated types.
 *
 * Mirrors `supabase/migrations/0001_init.sql`. Regenerate with:
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UserRole = "student" | "faculty" | "visitor" | "admin";
export type BinStatus = "active" | "inactive" | "maintenance";
export type SessionStatus = "pending" | "verified" | "expired" | "failed";
export type TransactionType = "earn" | "redeem" | "adjustment";
export type RedemptionStatus = "pending" | "fulfilled" | "cancelled";

// ── Per-table field shapes (Row is the full DB row; Insert/Update derive) ──

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  sap_id: string | null;
  avatar_url: string | null;
  eco_points: number;
  leaderboard_opt_in?: boolean;
  created_at: string;
};
export type ProfileInsert = {
  leaderboard_opt_in?: boolean;
  id: string;
  full_name: string;
  email: string;
  role?: UserRole;
  sap_id?: string | null;
  avatar_url?: string | null;
  eco_points?: number;
  created_at?: string;
};
export type ProfileUpdate = Partial<ProfileInsert>;

export type BinRow = {
  id: string;
  location: string;
  status: BinStatus;
  kind: "disposal" | "refill";
  proof_mode: "review" | "vision" | "fusion";
  created_at: string;
};
export type BinInsert = {
  id: string;
  location: string;
  status?: BinStatus;
  created_at?: string;
};
export type BinUpdate = Partial<BinInsert>;

export type SessionRow = {
  kind?: "disposal" | "refill";
  id: string;
  user_id: string;
  bin_id: string;
  status: SessionStatus;
  started_at: string;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
};
export type SessionInsert = {
  id?: string;
  user_id: string;
  bin_id: string;
  status?: SessionStatus;
  started_at?: string;
  expires_at?: string;
  verified_at?: string | null;
  created_at?: string;
};
export type SessionUpdate = Partial<SessionInsert>;

export type DisposalRow = {
  id: string;
  session_id: string;
  user_id: string;
  points_awarded: number;
  verification_payload: Record<string, unknown> | null;
  created_at: string;
};
export type DisposalInsert = {
  id?: string;
  session_id: string;
  user_id: string;
  points_awarded: number;
  verification_payload?: Record<string, unknown> | null;
  created_at?: string;
};

export type TransactionRow = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};
export type TransactionInsert = {
  id?: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  reference_id?: string | null;
  description?: string | null;
  created_at?: string;
};

export type RewardRow = {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
};
export type RewardInsert = {
  id?: string;
  name: string;
  description?: string | null;
  cost_points: number;
  stock?: number;
  image_url?: string | null;
  active?: boolean;
  created_at?: string;
};
export type RewardUpdate = Partial<RewardInsert>;

export type RedemptionRow = {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  created_at: string;
};
export type RedemptionInsert = {
  id?: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status?: RedemptionStatus;
  created_at?: string;
};

export type AchievementRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  threshold: number | null;
};
export type AchievementInsert = {
  id?: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  threshold?: number | null;
};

export type UserAchievementRow = {
  user_id: string;
  achievement_id: string;
  earned_at: string;
};
export type UserAchievementInsert = {
  user_id: string;
  achievement_id: string;
  earned_at?: string;
};

export type LeaderboardRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  eco_points: number;
  rank: number;
};

export type EvidenceRow = {
  id: string;
  session_id: string;
  user_id: string;
  device_id: string;
  boot_id: string;
  track_id: string;
  kind: "disposal" | "refill";
  observed_at: string;
  received_at: string;
  outcome: "verified" | "inconclusive" | "rejected";
  reason: string;
  evidence: Record<string, unknown>;
  request_hash: string;
  points: number;
};
export type AppealRow = {
  id: string;
  event_id: string;
  user_id: string;
  reason: string;
  created_at: string;
};
export type ReviewRow = {
  id: string;
  event_id: string;
  reviewer_id: string;
  approved: boolean;
  reason: string;
  created_at: string;
};
export type BatchRow = {
  id: string;
  bin_id: string;
  collected_kg: number;
  accepted_kg: number | null;
  contamination: string;
  collector_id: string;
  receiver_id: string | null;
  recycler: string | null;
  receipt: string | null;
  status: "collected" | "accepted";
  created_at: string;
  accepted_at: string | null;
};
type ReadTable<T> = { Row: T; Insert: never; Update: never; Relationships: [] };
type JsonResult = Record<string, unknown>;
export interface Database {
  public: {
    Tables: {
      verification_events: ReadTable<EvidenceRow>;
      appeals: ReadTable<AppealRow>;
      reviews: ReadTable<ReviewRow>;
      recycling_batches: ReadTable<BatchRow>;
      batch_items: ReadTable<{ event_id: string; batch_id: string }>;
      devices: ReadTable<{
        id: string;
        bin_id: string;
        active: boolean;
        beam_required: boolean;
        load_required: boolean;
      }>;
      profiles: {
        Relationships: [];
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      bins: {
        Relationships: [];
        Row: BinRow;
        Insert: BinInsert;
        Update: BinUpdate;
      };
      sessions: {
        Relationships: [];
        Row: SessionRow;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      disposals: {
        Relationships: [];
        Row: DisposalRow;
        Insert: DisposalInsert;
        Update: Partial<DisposalInsert>;
      };
      transactions: {
        Relationships: [];
        Row: TransactionRow;
        Insert: TransactionInsert;
        Update: Partial<TransactionInsert>;
      };
      rewards: {
        Relationships: [];
        Row: RewardRow;
        Insert: RewardInsert;
        Update: RewardUpdate;
      };
      redemptions: {
        Relationships: [];
        Row: RedemptionRow;
        Insert: RedemptionInsert;
        Update: Partial<RedemptionInsert>;
      };
      achievements: {
        Relationships: [];
        Row: AchievementRow;
        Insert: AchievementInsert;
        Update: Partial<AchievementInsert>;
      };
      user_achievements: {
        Relationships: [];
        Row: UserAchievementRow;
        Insert: UserAchievementInsert;
        Update: Partial<UserAchievementInsert>;
      };
    };
    Views: {
      leaderboard: {
        Relationships: [];
        Row: LeaderboardRow;
      };
    };
    Functions: {
      resolve_ecop_redemption: {
        Args: { p_redemption_id: string; p_action: string; p_note: string };
        Returns: JsonResult;
      };
      start_ecop_session: { Args: { p_bin_id: string }; Returns: JsonResult };
      record_ecop_event: {
        Args: { p_event: Record<string, unknown> };
        Returns: JsonResult;
      };
      appeal_ecop_event: {
        Args: { p_event_id: string; p_reason: string };
        Returns: JsonResult;
      };
      review_ecop_event: {
        Args: { p_event_id: string; p_approve: boolean; p_reason: string };
        Returns: JsonResult;
      };
      redeem_ecop_reward: {
        Args: { p_reward_id: string; p_request_id: string };
        Returns: JsonResult;
      };
      collect_ecop_batch: {
        Args: {
          p_bin_id: string;
          p_mass: number;
          p_contamination: string;
          p_event_ids: string[];
        };
        Returns: JsonResult;
      };
      accept_ecop_batch: {
        Args: {
          p_batch_id: string;
          p_mass: number;
          p_recycler: string;
          p_receipt: string;
        };
        Returns: JsonResult;
      };
      award_points_for_session: {
        Args: { p_session_id: string };
        Returns: {
          success: boolean;
          session_id: string;
          points_awarded: number;
          new_total: number;
          status: string;
          reason: string;
        }[];
      };
      redeem_reward: {
        Args: { p_reward_id: string };
        Returns: {
          success: boolean;
          redemption_id: string;
          reward_id: string;
          points_spent: number;
          new_total: number;
          status: string;
          reason: string;
        }[];
      };
      expire_stale_sessions: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      bin_status: BinStatus;
      session_status: SessionStatus;
      transaction_type: TransactionType;
      redemption_status: RedemptionStatus;
    };
  };
}
