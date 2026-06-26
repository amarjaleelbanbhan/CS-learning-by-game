/**
 * Database types for the ARC Reactor schema (supabase/migrations/0001_init.sql).
 *
 * Hand-authored to match the migration so the app is fully typed before the
 * project is provisioned. Regenerate from the live DB once migrations are
 * applied (Supabase `generate_typescript_types`) — the shape should match.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          level: number;
          xp: number;
          coins: number;
          current_streak: number;
          longest_streak: number;
          last_active: string | null;
          prefs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: { id: string; display_name?: string; avatar_url?: string | null };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      mission_progress: {
        Row: {
          user_id: string;
          mission_id: string;
          status: 'locked' | 'available' | 'in_progress' | 'completed';
          stage_state: Json;
          score: number | null;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          mission_id: string;
          status?: 'locked' | 'available' | 'in_progress' | 'completed';
          stage_state?: Json;
          score?: number | null;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['mission_progress']['Row']>;
        Relationships: [];
      };
      topic_mastery: {
        Row: {
          user_id: string;
          topic_id: string;
          mastery: number;
          last_reviewed_at: string | null;
          due_at: string | null;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          mastery?: number;
          last_reviewed_at?: string | null;
          due_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['topic_mastery']['Row']>;
        Relationships: [];
      };
      achievements: {
        Row: { id: string; title: string; description: string; icon: string | null; rule: Json };
        Insert: {
          id: string;
          title: string;
          description: string;
          icon?: string | null;
          rule?: Json;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Row']>;
        Relationships: [];
      };
      user_achievements: {
        Row: { user_id: string; achievement_id: string; unlocked_at: string };
        Insert: { user_id: string; achievement_id: string; unlocked_at?: string };
        Update: Partial<Database['public']['Tables']['user_achievements']['Row']>;
        Relationships: [];
      };
      problem_attempts: {
        Row: {
          id: string;
          user_id: string;
          topic_id: string;
          problem: Json;
          answer: Json | null;
          correct: boolean;
          hints_used: number;
          time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic_id: string;
          problem: Json;
          answer?: Json | null;
          correct?: boolean;
          hints_used?: number;
          time_ms?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['problem_attempts']['Row']>;
        Relationships: [];
      };
      events: {
        Row: { id: number; user_id: string | null; type: string; payload: Json; ts: string };
        Insert: { user_id?: string | null; type: string; payload?: Json; ts?: string };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
