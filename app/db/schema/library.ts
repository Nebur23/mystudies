// Add a search vector column (same pattern as student_profile)
// In the table definition, searchVector is omitted from Drizzle schema
// and managed via manual migration (see below)


// db/schema/library.ts
import { relations } from "drizzle-orm";
import { 
  pgTable, text, integer, boolean, timestamp, 
  index, jsonb, varchar, unique 
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const resourceCategory = pgTable("resource_category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(), // "Past Papers", "Textbooks", "Solutions", "Study Guides"
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"), // emoji or lucide icon name
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const resource = pgTable("resource", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id").notNull()
    .references(() => resourceCategory.id, { onDelete: "cascade" }),
  
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  
  // Metadata
  level: varchar("level", { enum: ["olevel", "alevel", "both"] }).notNull(),
  subject: text("subject").notNull(),
  year: integer("year"), // For past papers
  edition: text("edition"), // For textbooks
  publisher: text("publisher"),
  authors: text("authors"), // Comma-separated
  
  // File info
  fileType: varchar("file_type", { 
    enum: ["pdf", "doc", "docx", "ppt", "pptx", "zip", "link"] 
  }).notNull(),
  fileSize: integer("file_size"), // in bytes
  fileUrl: text("file_url").notNull(), // Supabase Storage URL or external link
  thumbnailUrl: text("thumbnail_url"),
  previewPages: integer("preview_pages"), // For PDFs
  
  // Access control
  isPublished: boolean("is_published").default(false),
  isPremium: boolean("is_premium").default(false), // For future monetization
  downloadCount: integer("download_count").default(0).notNull(),
  
  // Metadata
  uploadedBy: text("uploaded_by").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
},  (table) => [
  index("resource_category_idx").on(table.categoryId),
  index("resource_level_subject_idx").on(table.level, table.subject),
  index("resource_year_idx").on(table.year),
  index("resource_published_idx").on(table.isPublished),
  index("resource_slug_idx").on(table.slug),
  // ✅ Add: composite for the main listing query
  index("resource_published_level_subject_idx").on(table.isPublished, table.level, table.subject),
  index("resource_download_count_idx").on(table.downloadCount),
]);

export const resourceDownload = pgTable("resource_download", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resourceId: text("resource_id").notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
}, (table) => [
  index("resource_download_resource_idx").on(table.resourceId),
  index("resource_download_user_idx").on(table.userId),
  // Prevent duplicate downloads in same session (optional)
  unique("resource_download_unique").on(table.resourceId, table.userId, table.downloadedAt),
]);

export const resourceBookmark = pgTable("resource_bookmark", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  resourceId: text("resource_id").notNull()
    .references(() => resource.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("resource_bookmark_resource_idx").on(table.resourceId),
  index("resource_bookmark_user_idx").on(table.userId),
  unique("resource_bookmark_unique").on(table.resourceId, table.userId),
]);

// Relations
export const resourceCategoryRelations = relations(resourceCategory, ({ many }) => ({
  resources: many(resource),
}));

export const resourceRelations = relations(resource, ({ one, many }) => ({
  category: one(resourceCategory, { 
    fields: [resource.categoryId], 
    references: [resourceCategory.id] 
  }),
  uploader: one(user, { 
    fields: [resource.uploadedBy], 
    references: [user.id] 
  }),
  downloads: many(resourceDownload),
  bookmarks: many(resourceBookmark),
}));

export const resourceDownloadRelations = relations(resourceDownload, ({ one }) => ({
  resource: one(resource, { 
    fields: [resourceDownload.resourceId], 
    references: [resource.id] 
  }),
  user: one(user, { 
    fields: [resourceDownload.userId], 
    references: [user.id] 
  }),
}));

export const resourceBookmarkRelations = relations(resourceBookmark, ({ one }) => ({
  resource: one(resource, { 
    fields: [resourceBookmark.resourceId], 
    references: [resource.id] 
  }),
  user: one(user, { 
    fields: [resourceBookmark.userId], 
    references: [user.id] 
  }),
}));