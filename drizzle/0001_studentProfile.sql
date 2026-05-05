CREATE TABLE "student_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"level" varchar NOT NULL,
	"school" text,
	"location" text,
	"region" varchar,
	"display_name" text NOT NULL,
	"username" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"cover_image_url" text,
	"subjects" jsonb DEFAULT '[]'::jsonb,
	"target_exam_year" integer,
	"study_goals" jsonb DEFAULT '[]'::jsonb,
	"is_public" boolean DEFAULT true,
	"show_stats" boolean DEFAULT true,
	"show_subjects" boolean DEFAULT true,
	"show_badges" boolean DEFAULT true,
	"allow_direct_messages" boolean DEFAULT true,
	"allow_friend_requests" boolean DEFAULT true,
	"social_links" jsonb,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "student_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "student_profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_profile_userId_idx" ON "student_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_profile_username_idx" ON "student_profile" USING btree ("username");--> statement-breakpoint
CREATE INDEX "student_profile_level_region_idx" ON "student_profile" USING btree ("level","region");--> statement-breakpoint
CREATE INDEX "student_profile_school_idx" ON "student_profile" USING btree ("school");--> statement-breakpoint
CREATE INDEX "student_profile_subjects_gin" ON "student_profile" USING gin ("subjects");