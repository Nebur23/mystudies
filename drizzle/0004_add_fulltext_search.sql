ALTER TABLE "student_profile" ALTER COLUMN "avatar_url" SET DEFAULT 'https://www.gravatar.com/avatar?d=mp&f=y';--> statement-breakpoint


-- Enable pg_trgm for typo-tolerant fallback
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add tsvector column (Drizzle schema defines as text, PG will treat as tsvector)
ALTER TABLE student_profile 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Auto-sync trigger: keeps search_vector updated on INSERT/UPDATE
CREATE OR REPLACE FUNCTION sync_student_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.school, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
    -- ✅ FIXED: Properly handle jsonb subjects array
    CASE 
      WHEN NEW.subjects IS NOT NULL AND jsonb_array_length(NEW.subjects) > 0
      THEN setweight(
        array_to_tsvector(
          ARRAY(SELECT jsonb_array_elements_text(NEW.subjects))
        ), 
        'B'
      )
      ELSE ''::tsvector 
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS trg_sync_student_search_vector ON student_profile;

CREATE TRIGGER trg_sync_student_search_vector
  BEFORE INSERT OR UPDATE ON student_profile
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_search_vector();

-- Backfill existing rows (this will now work without error)
UPDATE student_profile SET search_vector = search_vector WHERE true;

-- GIN index for fast tsvector queries
CREATE INDEX IF NOT EXISTS idx_student_search_vector_gin 
ON student_profile USING gin(search_vector);

-- Optional: Index for pg_trgm fallback (improves similarity() performance)
CREATE INDEX IF NOT EXISTS idx_student_trgm_search 
ON student_profile USING gin((display_name || ' ' || username || ' ' || coalesce(school, '')) gin_trgm_ops);
