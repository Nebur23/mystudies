-- Run once, idempotent
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;  -- handles accented chars (Français, etc.)