// Placeholder until migration is run and types are regenerated with:
//   supabase gen types typescript --linked > lib/database.types.ts
//
// For v1 this is intentionally permissive so the build doesn't block.
// After the migration runs, swap this for generated types.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      preference_options: {
        Row: {
          id: string;
          label: string;
          emoji: string | null;
          activity_key: string;
          category: string | null;
          quiz_order: number | null;
          energy: string | null;
          social_setting: string | null;
          physical_exertion: string | null;
          novelty: string | null;
          setting: string | null;
          typical_cost: string | null;
          time_needed: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          label: string;
          emoji?: string | null;
          activity_key: string;
          category?: string | null;
          quiz_order?: number | null;
          energy?: string | null;
          social_setting?: string | null;
          physical_exertion?: string | null;
          novelty?: string | null;
          setting?: string | null;
          typical_cost?: string | null;
          time_needed?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          label?: string;
          emoji?: string | null;
          activity_key?: string;
          category?: string | null;
          quiz_order?: number | null;
          energy?: string | null;
          social_setting?: string | null;
          physical_exertion?: string | null;
          novelty?: string | null;
          setting?: string | null;
          typical_cost?: string | null;
          time_needed?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          preference_id: string;
          verdict: "yay" | "meh" | "nay";
        };
        Insert: {
          id?: string;
          user_id: string;
          preference_id: string;
          verdict: "yay" | "meh" | "nay";
        };
        Update: {
          id?: string;
          user_id?: string;
          preference_id?: string;
          verdict?: "yay" | "meh" | "nay";
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          hang_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hang_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hang_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendship_messages: {
        Row: {
          id: string;
          friendship_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          friendship_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          friendship_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      friendship_message_reads: {
        Row: {
          friendship_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: {
          friendship_id: string;
          user_id: string;
          last_read_at?: string;
        };
        Update: {
          friendship_id?: string;
          user_id?: string;
          last_read_at?: string;
        };
        Relationships: [];
      };
      hangs: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          preference_id: string;
          prompt_copy: string;
          swipe_a: "right" | "left" | null;
          swipe_b: "right" | "left" | null;
          matched: boolean;
          seen_a_at: string | null;
          seen_b_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          preference_id: string;
          prompt_copy: string;
          swipe_a?: "right" | "left" | null;
          swipe_b?: "right" | "left" | null;
          matched?: boolean;
          seen_a_at?: string | null;
          seen_b_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_a?: string;
          user_b?: string;
          preference_id?: string;
          prompt_copy?: string;
          swipe_a?: "right" | "left" | null;
          swipe_b?: "right" | "left" | null;
          matched?: boolean;
          seen_a_at?: string | null;
          seen_b_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
