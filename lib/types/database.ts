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
      achievements: {
        Row: {
          bullets: string[];
          created_at: string;
          date_label: string;
          id: string;
          is_visible: boolean;
          result: string;
          sort_order: number;
          title: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          bullets?: string[];
          created_at?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          result?: string;
          sort_order?: number;
          title: string;
          updated_at?: string;
          url?: string;
        };
        Update: {
          bullets?: string[];
          created_at?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          result?: string;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          created_at: string;
          credential_url: string;
          date_label: string;
          id: string;
          is_visible: boolean;
          issuer: string;
          media_id: string | null;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          credential_url?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          issuer?: string;
          media_id?: string | null;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          credential_url?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          issuer?: string;
          media_id?: string | null;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certifications_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      document_links: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_visible: boolean;
          media_id: string | null;
          sort_order: number;
          title: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          is_visible?: boolean;
          media_id?: string | null;
          sort_order?: number;
          title: string;
          updated_at?: string;
          url?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_visible?: boolean;
          media_id?: string | null;
          sort_order?: number;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_links_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      education: {
        Row: {
          created_at: string;
          date_label: string;
          description: string;
          id: string;
          institution: string;
          is_visible: boolean;
          media_id: string | null;
          qualification: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date_label?: string;
          description?: string;
          id?: string;
          institution?: string;
          is_visible?: boolean;
          media_id?: string | null;
          qualification: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Update: {
          created_at?: string;
          date_label?: string;
          description?: string;
          id?: string;
          institution?: string;
          is_visible?: boolean;
          media_id?: string | null;
          qualification?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "education_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      experiences: {
        Row: {
          bullets: string[];
          created_at: string;
          date_label: string;
          id: string;
          is_visible: boolean;
          organization: string;
          role: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          bullets?: string[];
          created_at?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          organization: string;
          role: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Update: {
          bullets?: string[];
          created_at?: string;
          date_label?: string;
          id?: string;
          is_visible?: boolean;
          organization?: string;
          role?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      interests: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          is_visible: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          color: string;
          created_at?: string;
          icon: string;
          id?: string;
          is_visible?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_visible?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt_text: string;
          bucket: string | null;
          created_at: string;
          height: number | null;
          id: string;
          is_public: boolean;
          kind: string;
          label: string;
          legacy_path: string | null;
          mime_type: string;
          object_path: string | null;
          size_bytes: number;
          updated_at: string;
          width: number | null;
        };
        ComputedFields: never;
        Insert: {
          alt_text?: string;
          bucket?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_public?: boolean;
          kind: string;
          label: string;
          legacy_path?: string | null;
          mime_type: string;
          object_path?: string | null;
          size_bytes: number;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string;
          bucket?: string | null;
          created_at?: string;
          height?: number | null;
          id?: string;
          is_public?: boolean;
          kind?: string;
          label?: string;
          legacy_path?: string | null;
          mime_type?: string;
          object_path?: string | null;
          size_bytes?: number;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      navigation_items: {
        Row: {
          created_at: string;
          id: string;
          is_visible: boolean;
          label: string;
          section_key: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          section_key: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          section_key?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "navigation_items_section_key_fkey";
            columns: ["section_key"];
            isOneToOne: true;
            referencedRelation: "section_settings";
            referencedColumns: ["key"];
          },
        ];
      };
      profile_facts: {
        Row: {
          created_at: string;
          icon: string;
          id: string;
          is_visible: boolean;
          label: string;
          placement: string;
          sort_order: number;
          updated_at: string;
          value: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          placement: string;
          sort_order?: number;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          placement?: string;
          sort_order?: number;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      project_media: {
        Row: {
          caption: string;
          created_at: string;
          id: string;
          media_id: string;
          project_id: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          caption?: string;
          created_at?: string;
          id?: string;
          media_id: string;
          project_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          caption?: string;
          created_at?: string;
          id?: string;
          media_id?: string;
          project_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_media_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          category: string;
          cover_media_id: string | null;
          created_at: string;
          demo_url: string;
          detail_title: string;
          download_url: string;
          featured: boolean;
          id: string;
          paragraphs: string[];
          published_at: string | null;
          seo_description: string;
          seo_title: string;
          slug: string;
          sort_order: number;
          source_url: string;
          status: string;
          summary: string;
          technologies: string[];
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          category?: string;
          cover_media_id?: string | null;
          created_at?: string;
          demo_url?: string;
          detail_title?: string;
          download_url?: string;
          featured?: boolean;
          id?: string;
          paragraphs?: string[];
          published_at?: string | null;
          seo_description?: string;
          seo_title?: string;
          slug: string;
          sort_order?: number;
          source_url?: string;
          status?: string;
          summary?: string;
          technologies?: string[];
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          cover_media_id?: string | null;
          created_at?: string;
          demo_url?: string;
          detail_title?: string;
          download_url?: string;
          featured?: boolean;
          id?: string;
          paragraphs?: string[];
          published_at?: string | null;
          seo_description?: string;
          seo_title?: string;
          slug?: string;
          sort_order?: number;
          source_url?: string;
          status?: string;
          summary?: string;
          technologies?: string[];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_cover_media_id_fkey";
            columns: ["cover_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      section_settings: {
        Row: {
          created_at: string;
          filter_all_label: string;
          is_visible: boolean;
          key: string;
          parent_key: string | null;
          sort_order: number;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          filter_all_label?: string;
          is_visible?: boolean;
          key: string;
          parent_key?: string | null;
          sort_order?: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          filter_all_label?: string;
          is_visible?: boolean;
          key?: string;
          parent_key?: string | null;
          sort_order?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "section_settings_parent_key_fkey";
            columns: ["parent_key"];
            isOneToOne: false;
            referencedRelation: "section_settings";
            referencedColumns: ["key"];
          },
        ];
      };
      site_settings: {
        Row: {
          biography: string;
          canonical_url: string;
          created_at: string;
          display_name: string;
          footer_text: string;
          full_name: string;
          icon_media_id: string | null;
          id: boolean;
          primary_cta_label: string;
          primary_cta_url: string;
          profile_media_id: string | null;
          role_prefix: string;
          roles: string[];
          secondary_cta_label: string;
          secondary_cta_url: string;
          seo_description: string;
          seo_image_media_id: string | null;
          seo_title: string;
          social_heading: string;
          twitter_handle: string;
          updated_at: string;
          updated_display: string;
          updated_label: string;
        };
        ComputedFields: never;
        Insert: {
          biography?: string;
          canonical_url?: string;
          created_at?: string;
          display_name: string;
          footer_text?: string;
          full_name: string;
          icon_media_id?: string | null;
          id?: boolean;
          primary_cta_label?: string;
          primary_cta_url?: string;
          profile_media_id?: string | null;
          role_prefix?: string;
          roles?: string[];
          secondary_cta_label?: string;
          secondary_cta_url?: string;
          seo_description?: string;
          seo_image_media_id?: string | null;
          seo_title?: string;
          social_heading?: string;
          twitter_handle?: string;
          updated_at?: string;
          updated_display?: string;
          updated_label?: string;
        };
        Update: {
          biography?: string;
          canonical_url?: string;
          created_at?: string;
          display_name?: string;
          footer_text?: string;
          full_name?: string;
          icon_media_id?: string | null;
          id?: boolean;
          primary_cta_label?: string;
          primary_cta_url?: string;
          profile_media_id?: string | null;
          role_prefix?: string;
          roles?: string[];
          secondary_cta_label?: string;
          secondary_cta_url?: string;
          seo_description?: string;
          seo_image_media_id?: string | null;
          seo_title?: string;
          social_heading?: string;
          twitter_handle?: string;
          updated_at?: string;
          updated_display?: string;
          updated_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_icon_media_id_fkey";
            columns: ["icon_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_settings_profile_media_id_fkey";
            columns: ["profile_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_settings_seo_image_media_id_fkey";
            columns: ["seo_image_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
        ];
      };
      skill_groups: {
        Row: {
          created_at: string;
          id: string;
          is_visible: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_visible?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          created_at: string;
          description: string;
          group_id: string;
          id: string;
          is_visible: boolean;
          logo_url: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          group_id: string;
          id?: string;
          is_visible?: boolean;
          logo_url?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          group_id?: string;
          id?: string;
          is_visible?: boolean;
          logo_url?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "skills_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "skill_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      social_links: {
        Row: {
          created_at: string;
          icon: string;
          id: string;
          is_visible: boolean;
          label: string;
          placement: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          icon: string;
          id?: string;
          is_visible?: boolean;
          label: string;
          placement: string;
          sort_order?: number;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_visible?: boolean;
          label?: string;
          placement?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
