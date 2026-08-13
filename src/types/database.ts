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
  created_at: string;
};
export type ProfileInsert = {
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      bins: {
        Row: BinRow;
        Insert: BinInsert;
        Update: BinUpdate;
      };
      sessions: {
        Row: SessionRow;
        Insert: SessionInsert;
        Update: SessionUpdate;
      };
      disposals: {
        Row: DisposalRow;
        Insert: DisposalInsert;
        Update: Partial<DisposalInsert>;
      };
      transactions: {
        Row: TransactionRow;
        Insert: TransactionInsert;
        Update: Partial<TransactionInsert>;
      };
      rewards: {
        Row: RewardRow;
        Insert: RewardInsert;
        Update: RewardUpdate;
      };
      redemptions: {
        Row: RedemptionRow;
        Insert: RedemptionInsert;
        Update: Partial<RedemptionInsert>;
      };
      achievements: {
        Row: AchievementRow;
        Insert: AchievementInsert;
        Update: Partial<AchievementInsert>;
      };
      user_achievements: {
        Row: UserAchievementRow;
        Insert: UserAchievementInsert;
        Update: Partial<UserAchievementInsert>;
      };
    };
    Views: {
      leaderboard: {
        Row: LeaderboardRow;
      };
    };
    Functions: {
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
