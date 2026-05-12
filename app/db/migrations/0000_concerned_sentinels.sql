CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "activity_like" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "activity_like_unique" UNIQUE("activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "leaderboard_ranking" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"average_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"quizzes_completed" integer DEFAULT 0 NOT NULL,
	"weekly_points" integer DEFAULT 0 NOT NULL,
	"monthly_points" integer DEFAULT 0 NOT NULL,
	"last_update_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_score" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"time_spent" integer NOT NULL,
	"completed_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
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
	"avatar_url" text DEFAULT 'https://www.gravatar.com/avatar?d=mp&f=y',
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
	"onboard_completed_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "student_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "student_profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "study_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"visibility" varchar DEFAULT 'public' NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'student' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"connection_context" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "user_connection_unique" UNIQUE("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comment" ADD CONSTRAINT "activity_comment_activity_id_study_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."study_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comment" ADD CONSTRAINT "activity_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_comment" ADD CONSTRAINT "activity_comment_parent_id_activity_comment_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."activity_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_activity_id_study_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."study_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_like" ADD CONSTRAINT "activity_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_ranking" ADD CONSTRAINT "leaderboard_ranking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_score" ADD CONSTRAINT "quiz_score_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profile" ADD CONSTRAINT "student_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_activity" ADD CONSTRAINT "study_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_comment_activity_idx" ON "activity_comment" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_comment_parent_idx" ON "activity_comment" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "activity_comment_createdAt_idx" ON "activity_comment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_like_activity_idx" ON "activity_like" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_like_user_idx" ON "activity_like" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_userId_idx" ON "leaderboard_ranking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_totalPoints_idx" ON "leaderboard_ranking" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_weeklyPoints_idx" ON "leaderboard_ranking" USING btree ("weekly_points");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_monthlyPoints_idx" ON "leaderboard_ranking" USING btree ("monthly_points");--> statement-breakpoint
CREATE INDEX "quiz_score_userId_idx" ON "quiz_score" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_score_quizId_idx" ON "quiz_score" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_score_completedAt_idx" ON "quiz_score" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_profile_userId_idx" ON "student_profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "student_profile_username_idx" ON "student_profile" USING btree ("username");--> statement-breakpoint
CREATE INDEX "student_profile_level_region_idx" ON "student_profile" USING btree ("level","region");--> statement-breakpoint
CREATE INDEX "student_profile_school_idx" ON "student_profile" USING btree ("school");--> statement-breakpoint
CREATE INDEX "student_profile_isPublic_idx" ON "student_profile" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "student_profile_subjects_gin" ON "student_profile" USING gin ("subjects");--> statement-breakpoint
CREATE INDEX "study_activity_userId_idx" ON "study_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_activity_type_idx" ON "study_activity" USING btree ("type");--> statement-breakpoint
CREATE INDEX "study_activity_createdAt_idx" ON "study_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "study_activity_feed_idx" ON "study_activity" USING btree ("user_id","visibility","created_at");--> statement-breakpoint
CREATE INDEX "user_connection_follower_idx" ON "user_connection" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "user_connection_following_idx" ON "user_connection" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "user_connection_status_idx" ON "user_connection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");