export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      push_tokens: {
        Row: { id: string; user_id: string; token: string; platform: string; created_at: string }
        Insert: { id?: string; user_id: string; token: string; platform?: string; created_at?: string }
        Update: { id?: string; user_id?: string; token?: string; platform?: string; created_at?: string }
        Relationships: []
      }
      notification_queue: {
        Row: { id: number; user_id: string; token: string; title: string; body: string; language: string | null; created_at: string; sent_at: string | null }
        Insert: { id?: number; user_id: string; token: string; title: string; body: string; language?: string | null; created_at?: string; sent_at?: string | null }
        Update: { id?: number; user_id?: string; token?: string; title?: string; body?: string; language?: string | null; created_at?: string; sent_at?: string | null }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived: boolean
          category: string
          color: string
          created_at: string
          deleted_at: string | null
          emoji: string
          frequency: string
          frequency_days: number[]
          id: string
          monthly_target: number
          name: string
          user_id: string
          weekly_target: number
        }
        Insert: {
          archived?: boolean
          category?: string
          color?: string
          created_at?: string
          deleted_at?: string | null
          emoji?: string
          frequency?: string
          frequency_days?: number[]
          id?: string
          monthly_target?: number
          name: string
          user_id: string
          weekly_target?: number
        }
        Update: {
          archived?: boolean
          category?: string
          color?: string
          created_at?: string
          deleted_at?: string | null
          emoji?: string
          frequency?: string
          frequency_days?: number[]
          id?: string
          monthly_target?: number
          name?: string
          user_id?: string
          weekly_target?: number
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          content_html: string
          created_at: string
          deleted_at: string | null
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          content_html?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_html?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      skating_elements: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      skating_locations: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      skating_session_elements: {
        Row: {
          created_at: string
          element_name: string
          id: string
          quality: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          element_name: string
          id?: string
          quality?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          element_name?: string
          id?: string
          quality?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skating_session_elements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "skating_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      skating_session_types: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      skating_sessions: {
        Row: {
          created_at: string
          date: string
          difficulty: number | null
          duration_min: number
          energy: number | null
          id: string
          improve: string | null
          intensity: number
          location: string | null
          mood: string | null
          next_goal: string | null
          notes: string | null
          rating: number | null
          session_type: string
          user_id: string
          went_well: string | null
          worked: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          difficulty?: number | null
          duration_min?: number
          energy?: number | null
          id?: string
          improve?: string | null
          intensity?: number
          location?: string | null
          mood?: string | null
          next_goal?: string | null
          notes?: string | null
          rating?: number | null
          session_type?: string
          user_id: string
          went_well?: string | null
          worked?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          difficulty?: number | null
          duration_min?: number
          energy?: number | null
          id?: string
          improve?: string | null
          intensity?: number
          location?: string | null
          mood?: string | null
          next_goal?: string | null
          notes?: string | null
          rating?: number | null
          session_type?: string
          user_id?: string
          went_well?: string | null
          worked?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          avatar_url: string | null
          evening_summary: boolean
          evening_time: string
          habit_notifications: boolean
          habit_notifications_count: number
          language: string
          last_habit_notification_date: string | null
          notifications_enabled: boolean
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          evening_summary?: boolean
          evening_time?: string
          habit_notifications?: boolean
          habit_notifications_count?: number
          language?: string
          last_habit_notification_date?: string | null
          notifications_enabled?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          evening_summary?: boolean
          evening_time?: string
          habit_notifications?: boolean
          habit_notifications_count?: number
          language?: string
          last_habit_notification_date?: string | null
          notifications_enabled?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
