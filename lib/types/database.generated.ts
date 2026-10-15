// Generated from applied migrations by npm run db:types; do not edit manually.
export type Database = { public: { Tables: {
achievements: {
Row: {
id: string;
name: string;
context: string;
result: string;
description: string;
url: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
name: string;
context?: string;
result?: string;
description?: string;
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
name?: string;
context?: string;
result?: string;
description?: string;
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
admin_profiles: {
Row: {
user_id: string;
created_at: string;
};
Insert: {
user_id: string;
created_at?: string;
};
Update: {
user_id?: string;
created_at?: string;
};
Relationships: [{ foreignKeyName: 'admin_profiles_user_id_fkey'; columns: ['user_id']; isOneToOne: true; referencedRelation: 'users'; referencedColumns: ['id']; }];
};
certifications: {
Row: {
id: string;
name: string;
issuer: string;
date_label: string;
image: string;
credential_url: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
image_media_id: string | null;
};
Insert: {
id?: string;
name: string;
issuer?: string;
date_label?: string;
image?: string;
credential_url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
image_media_id?: string | null;
};
Update: {
id?: string;
name?: string;
issuer?: string;
date_label?: string;
image?: string;
credential_url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
image_media_id?: string | null;
};
Relationships: [{ foreignKeyName: 'certifications_image_media_id_fkey'; columns: ['image_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; }];
};
contact_messages: {
Row: {
id: string;
name: string;
email: string;
message: string;
read_at: string | null;
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
name: string;
email: string;
message: string;
read_at?: string | null;
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
name?: string;
email?: string;
message?: string;
read_at?: string | null;
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
education: {
Row: {
id: string;
institution: string;
qualification: string;
date_label: string;
description: string;
image: string;
url: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
image_media_id: string | null;
};
Insert: {
id?: string;
institution: string;
qualification: string;
date_label?: string;
description?: string;
image?: string;
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
image_media_id?: string | null;
};
Update: {
id?: string;
institution?: string;
qualification?: string;
date_label?: string;
description?: string;
image?: string;
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
image_media_id?: string | null;
};
Relationships: [{ foreignKeyName: 'education_image_media_id_fkey'; columns: ['image_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; }];
};
experiences: {
Row: {
id: string;
organization: string;
role: string;
date_label: string;
location: string;
bullets: string[];
url: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
organization: string;
role: string;
date_label?: string;
location?: string;
bullets?: string[];
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
organization?: string;
role?: string;
date_label?: string;
location?: string;
bullets?: string[];
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
interests: {
Row: {
id: string;
name: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
name: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
name?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
media_assets: {
Row: {
id: string;
bucket: string;
object_path: string;
alt_text: string;
mime_type: string;
byte_size: number;
width: number | null;
height: number | null;
is_public: boolean;
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
bucket: string;
object_path: string;
alt_text?: string;
mime_type: string;
byte_size: number;
width?: number | null;
height?: number | null;
is_public?: boolean;
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
bucket?: string;
object_path?: string;
alt_text?: string;
mime_type?: string;
byte_size?: number;
width?: number | null;
height?: number | null;
is_public?: boolean;
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
navigation_items: {
Row: {
id: string;
label: string;
url: string;
kind: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
media_id: string | null;
};
Insert: {
id?: string;
label: string;
url: string;
kind?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
media_id?: string | null;
};
Update: {
id?: string;
label?: string;
url?: string;
kind?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
media_id?: string | null;
};
Relationships: [{ foreignKeyName: 'navigation_items_media_id_fkey'; columns: ['media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; }];
};
profile_facts: {
Row: {
id: string;
label: string;
value: string;
kind: string;
is_public: boolean;
sort_order: number;
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
label: string;
value: string;
kind?: string;
is_public?: boolean;
sort_order?: number;
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
label?: string;
value?: string;
kind?: string;
is_public?: boolean;
sort_order?: number;
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
project_media: {
Row: {
id: string;
project_id: string;
media_id: string;
caption: string;
sort_order: number;
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
project_id: string;
media_id: string;
caption?: string;
sort_order?: number;
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
project_id?: string;
media_id?: string;
caption?: string;
sort_order?: number;
created_at?: string;
updated_at?: string;
};
Relationships: [{ foreignKeyName: 'project_media_media_id_fkey'; columns: ['media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; },{ foreignKeyName: 'project_media_project_id_fkey'; columns: ['project_id']; isOneToOne: false; referencedRelation: 'projects'; referencedColumns: ['id']; }];
};
project_slug_aliases: {
Row: {
old_slug: string;
project_id: string;
created_at: string;
};
Insert: {
old_slug: string;
project_id: string;
created_at?: string;
};
Update: {
old_slug?: string;
project_id?: string;
created_at?: string;
};
Relationships: [{ foreignKeyName: 'project_slug_aliases_project_id_fkey'; columns: ['project_id']; isOneToOne: false; referencedRelation: 'projects'; referencedColumns: ['id']; }];
};
projects: {
Row: {
id: string;
title: string;
slug: string;
summary: string;
details: string;
category: string;
technologies: string[];
cover_image: string;
cover_alt: string;
cover_media_id: string | null;
repository_url: string;
demo_url: string;
download_url: string;
featured: boolean;
sort_order: number;
status: Database['public']['Enums']['content_status'];
published_at: string | null;
seo_title: string;
seo_description: string;
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
title: string;
slug: string;
summary?: string;
details?: string;
category?: string;
technologies?: string[];
cover_image?: string;
cover_alt?: string;
cover_media_id?: string | null;
repository_url?: string;
demo_url?: string;
download_url?: string;
featured?: boolean;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
published_at?: string | null;
seo_title?: string;
seo_description?: string;
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
title?: string;
slug?: string;
summary?: string;
details?: string;
category?: string;
technologies?: string[];
cover_image?: string;
cover_alt?: string;
cover_media_id?: string | null;
repository_url?: string;
demo_url?: string;
download_url?: string;
featured?: boolean;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
published_at?: string | null;
seo_title?: string;
seo_description?: string;
created_at?: string;
updated_at?: string;
};
Relationships: [{ foreignKeyName: 'projects_cover_media_id_fkey'; columns: ['cover_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; }];
};
section_settings: {
Row: {
id: string;
key: Database['public']['Enums']['section_key'];
title: string;
subtitle: string;
visible: boolean;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
key: Database['public']['Enums']['section_key'];
title: string;
subtitle?: string;
visible?: boolean;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
key?: Database['public']['Enums']['section_key'];
title?: string;
subtitle?: string;
visible?: boolean;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
site_settings: {
Row: {
id: number;
name: string;
headline: string;
summary: string;
biography: string;
profile_image: string;
hero_visual_caption: string;
last_updated_label: string;
show_last_updated: boolean;
primary_cta_label: string;
primary_cta_href: string;
secondary_cta_label: string;
secondary_cta_href: string;
footer_text: string;
seo_title: string;
seo_description: string;
contact_form_enabled: boolean;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
profile_media_id: string | null;
orbit_enabled: boolean;
favicon_image: string;
favicon_media_id: string | null;
social_preview_image: string;
social_preview_media_id: string | null;
};
Insert: {
id?: number;
name: string;
headline?: string;
summary?: string;
biography?: string;
profile_image?: string;
hero_visual_caption?: string;
last_updated_label?: string;
show_last_updated?: boolean;
primary_cta_label?: string;
primary_cta_href?: string;
secondary_cta_label?: string;
secondary_cta_href?: string;
footer_text?: string;
seo_title?: string;
seo_description?: string;
contact_form_enabled?: boolean;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
profile_media_id?: string | null;
orbit_enabled?: boolean;
favicon_image?: string;
favicon_media_id?: string | null;
social_preview_image?: string;
social_preview_media_id?: string | null;
};
Update: {
id?: number;
name?: string;
headline?: string;
summary?: string;
biography?: string;
profile_image?: string;
hero_visual_caption?: string;
last_updated_label?: string;
show_last_updated?: boolean;
primary_cta_label?: string;
primary_cta_href?: string;
secondary_cta_label?: string;
secondary_cta_href?: string;
footer_text?: string;
seo_title?: string;
seo_description?: string;
contact_form_enabled?: boolean;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
profile_media_id?: string | null;
orbit_enabled?: boolean;
favicon_image?: string;
favicon_media_id?: string | null;
social_preview_image?: string;
social_preview_media_id?: string | null;
};
Relationships: [{ foreignKeyName: 'site_settings_favicon_media_id_fkey'; columns: ['favicon_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; },{ foreignKeyName: 'site_settings_profile_media_id_fkey'; columns: ['profile_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; },{ foreignKeyName: 'site_settings_social_preview_media_id_fkey'; columns: ['social_preview_media_id']; isOneToOne: false; referencedRelation: 'media_assets'; referencedColumns: ['id']; }];
};
skill_groups: {
Row: {
id: string;
name: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
name: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
name?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
skills: {
Row: {
id: string;
group_id: string;
name: string;
description: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
group_id: string;
name: string;
description?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
group_id?: string;
name?: string;
description?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [{ foreignKeyName: 'skills_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'skill_groups'; referencedColumns: ['id']; }];
};
social_links: {
Row: {
id: string;
label: string;
icon: string;
url: string;
sort_order: number;
status: Database['public']['Enums']['content_status'];
created_at: string;
updated_at: string;
};
Insert: {
id?: string;
label: string;
icon?: string;
url: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Update: {
id?: string;
label?: string;
icon?: string;
url?: string;
sort_order?: number;
status?: Database['public']['Enums']['content_status'];
created_at?: string;
updated_at?: string;
};
Relationships: [];
};
}; Views: { [_ in never]: never }; Functions: {
submit_contact_message: { Args: { sender_name: string; sender_email: string; body_text: string; rate_key: string; }; Returns: string; };
}; Enums: {
content_status: 'draft' | 'published' | 'archived';
section_key: 'about' | 'projects' | 'experience' | 'skills' | 'education' | 'certifications' | 'achievements' | 'interests' | 'contact' | 'links';
}; CompositeTypes: { [_ in never]: never }; } };
export type TableName = keyof Database['public']['Tables'];
export type Row<T extends TableName> = Database['public']['Tables'][T]['Row'];
export type Insert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
export type Update<T extends TableName> = Database['public']['Tables'][T]['Update'];
