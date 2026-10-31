-- Full-text search on library resources
ALTER TABLE resource ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS resource_search_vector_gin
  ON resource USING gin(search_vector);

-- Trgm for partial/fuzzy search
CREATE INDEX IF NOT EXISTS resource_trgm_gin
  ON resource USING gin((
    coalesce(title, '') || ' ' ||
    coalesce(subject, '') || ' ' ||
    coalesce(description, '')
  ) gin_trgm_ops);

CREATE OR REPLACE FUNCTION resource_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', unaccent(coalesce(NEW.title, ''))),       'A') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.subject, ''))),      'B') ||
    setweight(to_tsvector('english', unaccent(coalesce(NEW.description, ''))), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resource_search_vector_trigger ON resource;
CREATE TRIGGER resource_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, subject, description
  ON resource FOR EACH ROW
  EXECUTE FUNCTION resource_search_vector_update();

-- Backfill
UPDATE resource SET updated_at = now() WHERE search_vector IS NULL;