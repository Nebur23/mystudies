ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'student';--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "onboard_completed_at" timestamp;