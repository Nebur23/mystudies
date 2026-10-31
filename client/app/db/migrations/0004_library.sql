CREATE TABLE "resource" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"level" varchar NOT NULL,
	"subject" text NOT NULL,
	"year" integer,
	"edition" text,
	"publisher" text,
	"authors" text,
	"file_type" varchar NOT NULL,
	"file_size" integer,
	"file_url" text NOT NULL,
	"thumbnail_url" text,
	"preview_pages" integer,
	"is_published" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"download_count" integer DEFAULT 0 NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "resource_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "resource_bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_bookmark_unique" UNIQUE("resource_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "resource_category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resource_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "resource_download" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"user_id" text NOT NULL,
	"downloaded_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	CONSTRAINT "resource_download_unique" UNIQUE("resource_id","user_id","downloaded_at")
);
--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_category_id_resource_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."resource_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource" ADD CONSTRAINT "resource_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_bookmark" ADD CONSTRAINT "resource_bookmark_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_bookmark" ADD CONSTRAINT "resource_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_download" ADD CONSTRAINT "resource_download_resource_id_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_download" ADD CONSTRAINT "resource_download_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resource_category_idx" ON "resource" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "resource_level_subject_idx" ON "resource" USING btree ("level","subject");--> statement-breakpoint
CREATE INDEX "resource_year_idx" ON "resource" USING btree ("year");--> statement-breakpoint
CREATE INDEX "resource_published_idx" ON "resource" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "resource_slug_idx" ON "resource" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "resource_published_level_subject_idx" ON "resource" USING btree ("is_published","level","subject");--> statement-breakpoint
CREATE INDEX "resource_download_count_idx" ON "resource" USING btree ("download_count");--> statement-breakpoint
CREATE INDEX "resource_bookmark_resource_idx" ON "resource_bookmark" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_bookmark_user_idx" ON "resource_bookmark" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resource_download_resource_idx" ON "resource_download" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_download_user_idx" ON "resource_download" USING btree ("user_id");