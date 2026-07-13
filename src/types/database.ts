export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin';
  reminder_time: string;
  reminder_enabled: boolean;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
      reading_plans: Table<ReadingPlan, Partial<ReadingPlan> & { title: string; duration_days: number }>;
      reading_plan_days: Table<ReadingPlanDay, Partial<ReadingPlanDay> & { plan_id: string; day_number: number; content: string }>;
      user_plan_progress: Table<UserPlanProgress, Partial<UserPlanProgress> & { user_id: string; plan_id: string }>;
      bookmarks: Table<Bookmark, Partial<Bookmark> & { user_id: string; devotion_id: string }>;
      prayer_requests: Table<PrayerRequest, Partial<PrayerRequest> & { user_id: string; content: string }>;
      prayer_interactions: Table<PrayerInteraction, Partial<PrayerInteraction> & { user_id: string; prayer_request_id: string }>;
      hymns: Table<Hymn, Partial<Hymn> & { title: string; lyrics: string }>;
      hymn_favorites: Table<HymnFavorite, Partial<HymnFavorite> & { user_id: string; hymn_id: string }>;
      push_tokens: Table<PushToken, Partial<PushToken> & { user_id: string; token: string }>;
    };
    Views: {};
    Functions: {};
  };
};
