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
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
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
ALTER TABLE "leaderboard_ranking" ADD CONSTRAINT "leaderboard_ranking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_score" ADD CONSTRAINT "quiz_score_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_userId_idx" ON "leaderboard_ranking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_totalPoints_idx" ON "leaderboard_ranking" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_weeklyPoints_idx" ON "leaderboard_ranking" USING btree ("weekly_points");--> statement-breakpoint
CREATE INDEX "leaderboard_ranking_monthlyPoints_idx" ON "leaderboard_ranking" USING btree ("monthly_points");--> statement-breakpoint
CREATE INDEX "quiz_score_userId_idx" ON "quiz_score" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_score_quizId_idx" ON "quiz_score" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_score_completedAt_idx" ON "quiz_score" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");