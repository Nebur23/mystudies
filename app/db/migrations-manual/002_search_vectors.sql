-- ─────────────────────────────────────────────────────────────
-- 1. Add search_vector column (skipped by Drizzle schema)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE student_profile
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- ─────────────────────────────────────────────────────────────
-- 2. GIN index on tsvector (full-text search)
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_profile_search_vector_gin
  ON student_profile USING gin(search_vector);

-- ─────────────────────────────────────────────────────────────
-- 3. GIN index on trigram expression (fuzzy/partial search)
--    Handles: "joh" → "john", typos, partial username matches
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS student_profile_trgm_gin
  ON student_profile USING gin(
    (
      coalesce(display_name, '') || ' ' ||
      coalesce(username, '')     || ' ' ||
      coalesce(school, '')       || ' ' ||
      coalesce(location, '')
    ) gin_trgm_ops
  );

-- ─────────────────────────────────────────────────────────────
-- 4. Trigger function — keeps search_vector in sync
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION student_profile_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    -- display_name: highest weight (A)
    setweight(to_tsvector('english', unaccent(coalesce(NEW.display_name, ''))), 'A') ||
    -- username: high weight (B) — no language stemming
    setweight(to_tsvector('simple',  unaccent(coalesce(NEW.username, ''))),      'B') ||
    -- school: medium weight (C)
    setweight(to_tsvector('english', unaccent(coalesce(NEW.school, ''))),         'C') ||
    -- bio + location: lower weight (D)
    setweight(to_tsvector('english', unaccent(coalesce(NEW.bio, ''))),            'D') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.location, ''))),       'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 5. Attach trigger
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS student_profile_search_vector_trigger ON student_profile;

CREATE TRIGGER student_profile_search_vector_trigger
  BEFORE INSERT OR UPDATE OF display_name, username, school, bio, location
  ON student_profile
  FOR EACH ROW
  EXECUTE FUNCTION student_profile_search_vector_update();

-- ─────────────────────────────────────────────────────────────
-- 6. Backfill existing rows
-- ─────────────────────────────────────────────────────────────
UPDATE student_profile SET updated_at = now()
  WHERE search_vector IS NULL;