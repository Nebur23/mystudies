DROP INDEX "student_profile_search_vector_gin";--> statement-breakpoint
DROP INDEX "study_activity_public_idx";--> statement-breakpoint
CREATE INDEX "student_profile_isPublic_idx" ON "student_profile" USING btree ("is_public");--> statement-breakpoint
ALTER TABLE "student_profile" DROP COLUMN "search_vector";