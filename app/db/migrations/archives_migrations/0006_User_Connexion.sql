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
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_connection_follower_idx" ON "user_connection" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "user_connection_following_idx" ON "user_connection" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "user_connection_status_idx" ON "user_connection" USING btree ("status");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "onboarding_completed";