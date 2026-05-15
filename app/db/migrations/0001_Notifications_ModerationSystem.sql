CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" varchar NOT NULL,
	"target_id" text NOT NULL,
	"reason" varchar NOT NULL,
	"details" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"in_app" boolean DEFAULT true,
	"email" boolean DEFAULT false,
	"push" boolean DEFAULT false,
	"read" boolean DEFAULT false,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_target_idx" ON "report" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_createdAt_idx" ON "report" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_reporterId_idx" ON "report" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "user_notification_userId_idx" ON "user_notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_notification_unread_idx" ON "user_notification" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "user_notification_createdAt_idx" ON "user_notification" USING btree ("created_at");