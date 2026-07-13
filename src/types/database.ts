export type Locale = 'en' | 'fr' | 'yo' | 'ig' | 'ha';
export type ThemePreference = 'system' | 'light' | 'dark';
export type Role = 'member' | 'editor' | 'moderator' | 'admin';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  reminder_time: string;
  reminder_enabled: boolean;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  locale: Locale;
  theme_preference: ThemePreference;
  font_scale: number;
  has_onboarded: boolean;
  created_at: string;
};

export type Devotion = {
  id: string;
  devotion_date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string | null;
  body: string;
  author: string | null;
  image_url: string | null;
  audio_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  language: Locale;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DevotionScriptureVersion = {
  id: string;
  devotion_id: string;
  translation_code: string;
  translation_name: string;
  scripture_text: string;
  created_at: string;
};

export type DevotionRead = {
  id: string;
  user_id: string;
  devotion_id: string;
  created_at: string;
};

export type DevotionHighlight = {
  id: string;
  user_id: string;
  devotion_id: string;
  segment_index: number;
  color: string;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
  created_at: string;
};

export type DevotionTag = {
  devotion_id: string;
  tag_id: string;
};

export type PlanTag = {
  plan_id: string;
  tag_id: string;
};

export type ReadingPlan = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  duration_days: number;
  created_by: string | null;
  created_at: string;
};

export type ReadingPlanDay = {
  id: string;
  plan_id: string;
  day_number: number;
  title: string | null;
  scripture_reference: string | null;
  content: string;
};

export type UserPlanProgress = {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
};

export type Bookmark = {
  id: string;
  user_id: string;
  devotion_id: string;
  created_at: string;
};

export type PrayerRequest = {
  id: string;
  user_id: string;
  display_name: string | null;
  is_anonymous: boolean;
  content: string;
  status: 'active' | 'answered';
  prayer_count: number;
  created_at: string;
};

export type PrayerInteraction = {
  id: string;
  prayer_request_id: string;
  user_id: string;
  created_at: string;
};

export type PrayerReply = {
  id: string;
  prayer_request_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type PrayerReport = {
  id: string;
  prayer_request_id: string;
  reported_by: string;
  reason: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
};

export type Hymn = {
  id: string;
  number: number | null;
  title: string;
  lyrics: string;
  author: string | null;
  category: string | null;
  audio_url: string | null;
  created_at: string;
};

export type HymnFavorite = {
  id: string;
  user_id: string;
  hymn_id: string;
  created_at: string;
};

export type PushToken = {
  id: string;
  user_id: string;
  token: string;
  device_type: string | null;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  event_date: string | null;
  created_by: string | null;
  created_at: string;
};

export type Sermon = {
  id: string;
  title: string;
  speaker: string | null;
  sermon_date: string;
  description: string | null;
  audio_url: string | null;
  created_by: string | null;
  created_at: string;
};

export type Ministry = {
  id: string;
  name: string;
  description: string | null;
  leader_name: string | null;
  leader_contact: string | null;
  meeting_schedule: string | null;
  created_by: string | null;
  created_at: string;
};

export type ChurchInfo = {
  id: number;
  name: string;
  address: string | null;
  service_times: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  map_url: string | null;
  updated_at: string;
};

export type StaffMember = {
  id: string;
  full_name: string;
  role_title: string | null;
  photo_url: string | null;
  email: string | null;
  order_index: number;
  created_at: string;
};

export type GivingSettings = {
  id: number;
  giving_url: string | null;
  note: string | null;
  updated_at: string;
};

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, Partial<Profile> & { id: string }>;
      devotions: Table<Devotion, Partial<Devotion> & { devotion_date: string; title: string; scripture_reference: string; body: string }>;
      devotion_scripture_versions: Table<DevotionScriptureVersion, Partial<DevotionScriptureVersion> & { devotion_id: string; translation_code: string; translation_name: string; scripture_text: string }>;
      devotion_reads: Table<DevotionRead, Partial<DevotionRead> & { user_id: string; devotion_id: string }>;
      devotion_highlights: Table<DevotionHighlight, Partial<DevotionHighlight> & { user_id: string; devotion_id: string; segment_index: number }>;
      tags: Table<Tag, Partial<Tag> & { name: string }>;
      devotion_tags: Table<DevotionTag, DevotionTag>;
      plan_tags: Table<PlanTag, PlanTag>;
      reading_plans: Table<ReadingPlan, Partial<ReadingPlan> & { title: string; duration_days: number }>;
      reading_plan_days: Table<ReadingPlanDay, Partial<ReadingPlanDay> & { plan_id: string; day_number: number; content: string }>;
      user_plan_progress: Table<UserPlanProgress, Partial<UserPlanProgress> & { user_id: string; plan_id: string }>;
      bookmarks: Table<Bookmark, Partial<Bookmark> & { user_id: string; devotion_id: string }>;
      prayer_requests: Table<PrayerRequest, Partial<PrayerRequest> & { user_id: string; content: string }>;
      prayer_interactions: Table<PrayerInteraction, Partial<PrayerInteraction> & { user_id: string; prayer_request_id: string }>;
      prayer_replies: Table<PrayerReply, Partial<PrayerReply> & { user_id: string; prayer_request_id: string; content: string }>;
      prayer_reports: Table<PrayerReport, Partial<PrayerReport> & { prayer_request_id: string; reported_by: string }>;
      hymns: Table<Hymn, Partial<Hymn> & { title: string; lyrics: string }>;
      hymn_favorites: Table<HymnFavorite, Partial<HymnFavorite> & { user_id: string; hymn_id: string }>;
      push_tokens: Table<PushToken, Partial<PushToken> & { user_id: string; token: string }>;
      announcements: Table<Announcement, Partial<Announcement> & { title: string; body: string }>;
      sermons: Table<Sermon, Partial<Sermon> & { title: string; sermon_date: string }>;
      ministries: Table<Ministry, Partial<Ministry> & { name: string }>;
      church_info: Table<ChurchInfo, Partial<ChurchInfo> & { id: number }>;
      staff_members: Table<StaffMember, Partial<StaffMember> & { full_name: string }>;
      giving_settings: Table<GivingSettings, Partial<GivingSettings> & { id: number }>;
    };
    Views: {};
    Functions: {
      record_devotion_read: { Args: { p_devotion_id: string }; Returns: void };
    };
  };
};
