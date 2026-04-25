-- api/db/migrations/006_social.sql

CREATE TABLE follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower  ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE post_likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, workout_id)
);

CREATE TABLE post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_workout ON post_comments(workout_id);

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS shared_at TIMESTAMPTZ NULL;

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE follows       ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_own"   ON follows FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());
CREATE POLICY "follows_insert_own"   ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
CREATE POLICY "follows_delete_own"   ON follows FOR DELETE USING (follower_id = auth.uid());

CREATE POLICY "post_likes_select_all"  ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own"  ON post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete_own"  ON post_likes FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "post_comments_select_all" ON post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert_own" ON post_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_comments_delete_own" ON post_comments FOR DELETE USING (user_id = auth.uid());
