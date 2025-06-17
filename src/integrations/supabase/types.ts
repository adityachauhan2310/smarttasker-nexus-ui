export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      calendar_events: {
        Row: {
          assigned_by_id: string | null
          assignee_id: string | null
          attendees: string[] | null
          created_at: string
          date: string
          description: string | null
          duration: number | null
          id: string
          impact: string | null
          priority: string | null
          status: string | null
          task_id: string | null
          team_id: string | null
          time: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          assigned_by_id?: string | null
          assignee_id?: string | null
          attendees?: string[] | null
          created_at?: string
          date: string
          description?: string | null
          duration?: number | null
          id?: string
          impact?: string | null
          priority?: string | null
          status?: string | null
          task_id?: string | null
          team_id?: string | null
          time?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          assigned_by_id?: string | null
          assignee_id?: string | null
          attendees?: string[] | null
          created_at?: string
          date?: string
          description?: string | null
          duration?: number | null
          id?: string
          impact?: string | null
          priority?: string | null
          status?: string | null
          task_id?: string | null
          team_id?: string | null
          time?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          email_sent: boolean
          email_sent_at: string | null
          id: string
          message: string
          priority: string
          read: boolean
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          message: string
          priority?: string
          read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          message?: string
          priority?: string
          read?: boolean
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notification_preferences: Json | null
          role: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          notification_preferences?: Json | null
          role?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notification_preferences?: Json | null
          role?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tasks: {
        Row: {
          created_at: string
          created_by: string
          day_of_month: number | null
          days_of_week: number[] | null
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          interval_value: number
          last_generated_date: string | null
          max_occurrences: number | null
          next_generation_date: string | null
          paused: boolean
          skip_dates: string[] | null
          skip_holidays: boolean
          skip_weekends: boolean
          start_date: string
          task_template: Json
          tasks_generated: number
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          interval_value?: number
          last_generated_date?: string | null
          max_occurrences?: number | null
          next_generation_date?: string | null
          paused?: boolean
          skip_dates?: string[] | null
          skip_holidays?: boolean
          skip_weekends?: boolean
          start_date: string
          task_template: Json
          tasks_generated?: number
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          interval_value?: number
          last_generated_date?: string | null
          max_occurrences?: number | null
          next_generation_date?: string | null
          paused?: boolean
          skip_dates?: string[] | null
          skip_holidays?: boolean
          skip_weekends?: boolean
          start_date?: string
          task_template?: Json
          tasks_generated?: number
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          created_at: string
          id: string
          task_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_time: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_time: number | null
          id: string
          priority: string
          status: string
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_time?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_time?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_time?: number | null
          id?: string
          priority?: string
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          leader_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          leader_id?: string
          name?: string
          updated_at?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
