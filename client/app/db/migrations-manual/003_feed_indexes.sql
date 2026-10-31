-- Partial index for public feed (Drizzle can't generate WHERE clause indexes)
CREATE INDEX IF NOT EXISTS study_activity_public_feed_idx
  ON study_activity (created_at DESC)
  WHERE visibility = 'public';

-- Partial index for connections feed
CREATE INDEX IF NOT EXISTS study_activity_connections_feed_idx
  ON study_activity (user_id, created_at DESC)
  WHERE visibility IN ('public', 'connections_only');

-- Composite for user profile page (own activities)
CREATE INDEX IF NOT EXISTS study_activity_profile_page_idx
  ON study_activity (user_id, created_at DESC);

-- likes_count for trending feed
CREATE INDEX IF NOT EXISTS study_activity_trending_idx
  ON study_activity (likes_count DESC, created_at DESC)
  WHERE visibility = 'public';