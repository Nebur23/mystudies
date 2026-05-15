CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"level" varchar NOT NULL,
	"subject" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "course_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course_lesson" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"title" text NOT NULL,
	"youtube_video_id" text NOT NULL,
	"duration" integer,
	"order" integer NOT NULL,
	"resources" jsonb
);
--> statement-breakpoint
CREATE TABLE "course_module" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"watched_seconds" integer DEFAULT 0,
	"completed" boolean DEFAULT false,
	"last_watched_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "course_lesson" ADD CONSTRAINT "course_lesson_module_id_course_module_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_module"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_module" ADD CONSTRAINT "course_module_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_course_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lesson"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_lesson_progress_user_lesson_idx" ON "user_lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "user_lesson_progress_completed_idx" ON "user_lesson_progress" USING btree ("user_id","completed");