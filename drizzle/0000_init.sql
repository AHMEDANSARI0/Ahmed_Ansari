CREATE TYPE "public"."admin_role_key" AS ENUM('owner', 'editor', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."backup_kind" AS ENUM('content', 'configuration', 'full');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'contacted', 'qualified', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'document', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_stage" AS ENUM('live', 'in-development', 'concept', 'archived');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"group" varchar(60) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	CONSTRAINT "admin_role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" "admin_role_key" NOT NULL,
	"label" varchar(80) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"user_agent" varchar(500),
	"ip_hash" varchar(64),
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(120) NOT NULL,
	"password_hash" text NOT NULL,
	"role_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failed_attempts" smallint DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_assistant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"provider" varchar(40) DEFAULT 'openai-compatible' NOT NULL,
	"model" varchar(80),
	"system_instructions" text,
	"welcome_message" text,
	"suggested_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_messages_per_session" integer DEFAULT 12 NOT NULL,
	"rate_limit_per_hour" integer DEFAULT 30 NOT NULL,
	"fallback_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_knowledge_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" varchar(300) NOT NULL,
	"answer" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(40) NOT NULL,
	"path" varchar(255),
	"referrer_host" varchar(120),
	"device_category" varchar(20),
	"country" varchar(2),
	"visitor_hash" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "animation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(40) DEFAULT 'global' NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"action" varchar(80) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60),
	"summary" varchar(300),
	"metadata" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(40) DEFAULT 'global' NOT NULL,
	"section_key" varchar(40),
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backup_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "backup_kind" NOT NULL,
	"file_name" varchar(200) NOT NULL,
	"url" text,
	"size_bytes" integer,
	"table_counts" jsonb,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(160),
	"project_type" varchar(80),
	"budget_range" varchar(60),
	"timeline" varchar(60),
	"message" text NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"source" varchar(60) DEFAULT 'website' NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" varchar(60) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "education" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution" varchar(160) NOT NULL,
	"program" varchar(160) NOT NULL,
	"location" varchar(120),
	"start_year" varchar(4) NOT NULL,
	"end_year" varchar(4),
	"summary" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(20) DEFAULT 'work' NOT NULL,
	"role" varchar(140) NOT NULL,
	"organization" varchar(140) NOT NULL,
	"location" varchar(120),
	"description" text,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" varchar(7) NOT NULL,
	"end_date" varchar(7),
	"is_current" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inquiry_id" uuid NOT NULL,
	"admin_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"ip_hash" varchar(64),
	"succeeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"kind" "media_kind" DEFAULT 'image' NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" varchar(220),
	"storage_driver" varchar(20) NOT NULL,
	"checksum" varchar(64),
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" varchar(220) NOT NULL,
	"caption" varchar(220),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_technologies" (
	"project_id" uuid NOT NULL,
	"technology_id" uuid NOT NULL,
	CONSTRAINT "project_technologies_project_id_technology_id_pk" PRIMARY KEY("project_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(160) NOT NULL,
	"short_description" varchar(320) NOT NULL,
	"full_description" text NOT NULL,
	"problem" text,
	"solution" text,
	"architecture" text,
	"outcome" text,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "publish_status" DEFAULT 'draft' NOT NULL,
	"stage" "project_stage" DEFAULT 'in-development' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"cover_image_url" text,
	"architecture_image_url" text,
	"demo_url" text,
	"repo_url" text,
	"seo_title" varchar(200),
	"seo_description" varchar(320),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_buckets" (
	"key" varchar(160) PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"field_key" varchar(60) NOT NULL,
	"value" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(40) NOT NULL,
	"label" varchar(80) NOT NULL,
	"nav_label" varchar(40),
	"anchor" varchar(40) NOT NULL,
	"eyebrow" varchar(80),
	"heading" varchar(200),
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"show_in_nav" boolean DEFAULT false NOT NULL,
	"background_override" jsonb,
	"animation_type" varchar(40),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(120) NOT NULL,
	"summary" varchar(320) NOT NULL,
	"description" text,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon" varchar(40),
	"cta_label" varchar(60),
	"cta_href" varchar(200),
	"price_label" varchar(80),
	"show_price" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(60) NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(320),
	"icon" varchar(40),
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"label" varchar(80) NOT NULL,
	"note" varchar(160),
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(40) NOT NULL,
	"label" varchar(60) NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technologies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" varchar(320),
	"icon_url" text,
	"category_id" uuid,
	"website_url" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" varchar(120) NOT NULL,
	"author_role" varchar(140),
	"company" varchar(140),
	"quote" text NOT NULL,
	"avatar_url" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "theme_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(40) DEFAULT 'global' NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_admin_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."admin_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animation_settings" ADD CONSTRAINT "animation_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "background_settings" ADD CONSTRAINT "background_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup_records" ADD CONSTRAINT "backup_records_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_inquiry_id_contact_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."contact_inquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiry_notes" ADD CONSTRAINT "inquiry_notes_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_admins_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_images" ADD CONSTRAINT "project_images_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_technologies" ADD CONSTRAINT "project_technologies_technology_id_technologies_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."technologies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_content" ADD CONSTRAINT "section_content_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technologies" ADD CONSTRAINT "technologies_category_id_skill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."skill_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_sessions_token_key" ON "admin_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_expiry_idx" ON "admin_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_key" ON "admins" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "admins_role_idx" ON "admins" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_assistant_settings_singleton" ON "ai_assistant_settings" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "ai_knowledge_position_idx" ON "ai_knowledge_entries" USING btree ("position");--> statement-breakpoint
CREATE INDEX "analytics_type_created_idx" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_visitor_idx" ON "analytics_events" USING btree ("visitor_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "animation_settings_scope_key" ON "animation_settings" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "background_settings_scope_key" ON "background_settings" USING btree ("scope","section_key");--> statement-breakpoint
CREATE INDEX "inquiries_status_idx" ON "contact_inquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "inquiries_read_idx" ON "contact_inquiries" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "inquiries_created_idx" ON "contact_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_unique" ON "content_versions" USING btree ("entity","entity_id","version");--> statement-breakpoint
CREATE INDEX "content_versions_entity_idx" ON "content_versions" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "experience_kind_position_idx" ON "experience" USING btree ("kind","position");--> statement-breakpoint
CREATE INDEX "inquiry_notes_inquiry_idx" ON "inquiry_notes" USING btree ("inquiry_id","created_at");--> statement-breakpoint
CREATE INDEX "login_attempts_identifier_idx" ON "login_attempts" USING btree ("identifier","created_at");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_assets_checksum_idx" ON "media_assets" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "project_images_project_idx" ON "project_images" USING btree ("project_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_key" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_status_position_idx" ON "projects" USING btree ("status","position");--> statement-breakpoint
CREATE INDEX "projects_featured_idx" ON "projects" USING btree ("is_featured");--> statement-breakpoint
CREATE UNIQUE INDEX "section_content_unique" ON "section_content" USING btree ("section_id","field_key");--> statement-breakpoint
CREATE UNIQUE INDEX "sections_key_key" ON "sections" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "services_slug_key" ON "services" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_categories_key_key" ON "skill_categories" USING btree ("key");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links" USING btree ("platform");--> statement-breakpoint
CREATE UNIQUE INDEX "technologies_slug_key" ON "technologies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "technologies_position_idx" ON "technologies" USING btree ("position");--> statement-breakpoint
CREATE UNIQUE INDEX "theme_settings_scope_key" ON "theme_settings" USING btree ("scope");