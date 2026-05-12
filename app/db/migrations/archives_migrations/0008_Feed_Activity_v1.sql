DROP INDEX "study_activity_public_idx";--> statement-breakpoint
CREATE INDEX "study_activity_public_idx" ON "study_activity" USING btree ("created_at") WHERE visibility = 'public';