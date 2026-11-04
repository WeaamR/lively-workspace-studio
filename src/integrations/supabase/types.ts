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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      change_reviews: {
        Row: {
          classification: string
          client_message: string
          created_at: string | null
          findings: Json
          id: string
          message_id: string | null
          project_id: string
          scope_version_id: string
          suggested_response: string | null
          user_id: string
        }
        Insert: {
          classification?: string
          client_message: string
          created_at?: string | null
          findings?: Json
          id?: string
          message_id?: string | null
          project_id: string
          scope_version_id: string
          suggested_response?: string | null
          user_id: string
        }
        Update: {
          classification?: string
          client_message?: string
          created_at?: string | null
          findings?: Json
          id?: string
          message_id?: string | null
          project_id?: string
          scope_version_id?: string
          suggested_response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_reviews_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_reviews_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "change_reviews_scope_version_id_user_id_fkey"
            columns: ["scope_version_id", "user_id"]
            isOneToOne: false
            referencedRelation: "scope_versions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          project_id: string
          sender_role: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          project_id: string
          sender_role: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          project_id?: string
          sender_role?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      projects: {
        Row: {
          client_email: string | null
          client_name: string | null
          created_at: string | null
          deadline: string | null
          id: string
          original_request: string | null
          service_id: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          original_request?: string | null
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          created_at?: string | null
          deadline?: string | null
          id?: string
          original_request?: string | null
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_service_owner_fkey"
            columns: ["service_id", "user_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      request_analyses: {
        Row: {
          ambiguities: Json
          analysis_status: string
          confirmed_facts: Json
          created_at: string | null
          id: string
          missing_information: Json
          model_name: string | null
          project_id: string
          raw_result: Json | null
          risks: Json
          suggested_client_message: string | null
          suggested_questions: Json
          user_id: string
        }
        Insert: {
          ambiguities?: Json
          analysis_status?: string
          confirmed_facts?: Json
          created_at?: string | null
          id?: string
          missing_information?: Json
          model_name?: string | null
          project_id: string
          raw_result?: Json | null
          risks?: Json
          suggested_client_message?: string | null
          suggested_questions?: Json
          user_id: string
        }
        Update: {
          ambiguities?: Json
          analysis_status?: string
          confirmed_facts?: Json
          created_at?: string | null
          id?: string
          missing_information?: Json
          model_name?: string | null
          project_id?: string
          raw_result?: Json | null
          risks?: Json
          suggested_client_message?: string | null
          suggested_questions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_analyses_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      scope_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          scope_version_id: string
          sort_order: number | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          scope_version_id: string
          sort_order?: number | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          scope_version_id?: string
          sort_order?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_items_scope_version_id_user_id_fkey"
            columns: ["scope_version_id", "user_id"]
            isOneToOne: false
            referencedRelation: "scope_versions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      scope_versions: {
        Row: {
          approved_at: string | null
          client_responsibilities: Json
          created_at: string | null
          deliverables: Json
          delivery_condition: string | null
          delivery_deadline: string | null
          excluded_services: Json
          id: string
          included_services: Json
          project_id: string
          revision_rounds: number | null
          scope_title: string | null
          status: string
          summary: string | null
          terms: string | null
          updated_at: string | null
          user_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          client_responsibilities?: Json
          created_at?: string | null
          deliverables?: Json
          delivery_condition?: string | null
          delivery_deadline?: string | null
          excluded_services?: Json
          id?: string
          included_services?: Json
          project_id: string
          revision_rounds?: number | null
          scope_title?: string | null
          status?: string
          summary?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          client_responsibilities?: Json
          created_at?: string | null
          deliverables?: Json
          delivery_condition?: string | null
          delivery_deadline?: string | null
          excluded_services?: Json
          id?: string
          included_services?: Json
          project_id?: string
          revision_rounds?: number | null
          scope_title?: string | null
          status?: string
          summary?: string | null
          terms?: string | null
          updated_at?: string | null
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "scope_versions_project_id_user_id_fkey"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number | null
          created_at: string | null
          currency: string | null
          deliverables: Json
          description: string | null
          estimated_days: number | null
          exclusions: Json
          id: string
          is_active: boolean | null
          name: string
          pricing_model: string | null
          revision_rounds: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          deliverables?: Json
          description?: string | null
          estimated_days?: number | null
          exclusions?: Json
          id?: string
          is_active?: boolean | null
          name: string
          pricing_model?: string | null
          revision_rounds?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          currency?: string | null
          deliverables?: Json
          description?: string | null
          estimated_days?: number | null
          exclusions?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          pricing_model?: string | null
          revision_rounds?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_scope_version: {
        Args: { p_scope_version_id: string }
        Returns: string
      }
      get_scope_unresolved_items: {
        Args: { p_scope_version_id: string }
        Returns: {
          category: string
          description: string
          item_id: string
          sort_order: number
          title: string
        }[]
      }
      resolve_scope_item: {
        Args: {
          p_item_id: string
          p_new_category: string
          p_new_description?: string
          p_new_title: string
        }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
