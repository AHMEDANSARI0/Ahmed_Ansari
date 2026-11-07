import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
};

export const publishStatus = pgEnum("publish_status", ["draft", "published", "archived"]);
export const projectStage = pgEnum("project_stage", [
  "live",
  "in-development",
  "concept",
  "archived",
]);
export const inquiryStatus = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "qualified",
  "converted",
  "archived",
]);
export const mediaKind = pgEnum("media_kind", ["image", "document", "other"]);
export const backupKind = pgEnum("backup_kind", ["content", "configuration", "full"]);
export const adminRoleKey = pgEnum("admin_role_key", ["owner", "editor", "viewer"]);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar({ length: 255 }).notNull(),
    name: varchar({ length: 120 }).notNull(),
    passwordHash: text().notNull(),
    roleId: uuid().notNull(),
    isActive: boolean().notNull().default(true),
    failedAttempts: smallint().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true }),
    lastLoginAt: timestamp({ withTimezone: true }),
    passwordChangedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("admins_email_key").on(sql`lower(${table.email})`),
    index("admins_role_idx").on(table.roleId),
  ],
);

export const adminRoles = pgTable("admin_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: adminRoleKey().notNull().unique(),
  label: varchar({ length: 80 }).notNull(),
  description: text(),
  isSystem: boolean().notNull().default(true),
  ...timestamps,
});

export const adminPermissions = pgTable("admin_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar({ length: 80 }).notNull().unique(),
  label: varchar({ length: 120 }).notNull(),
  group: varchar({ length: 60 }).notNull(),
  ...timestamps,
});

export const adminRolePermissions = pgTable(
  "admin_role_permissions",
  {
    roleId: uuid()
      .notNull()
      .references(() => adminRoles.id, { onDelete: "cascade" }),
    permissionId: uuid()
      .notNull()
      .references(() => adminPermissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid()
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    tokenHash: varchar({ length: 64 }).notNull(),
    userAgent: varchar({ length: 500 }),
    ipHash: varchar({ length: 64 }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_sessions_token_key").on(table.tokenHash),
    index("admin_sessions_admin_idx").on(table.adminId),
    index("admin_sessions_expiry_idx").on(table.expiresAt),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar({ length: 60 }).notNull(),
    value: jsonb().notNull(),
    updatedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("site_settings_key_key").on(table.key)],
);

export const themeSettings = pgTable(
  "theme_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar({ length: 40 }).notNull().default("global"),
    value: jsonb().notNull(),
    updatedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("theme_settings_scope_key").on(table.scope)],
);

export const backgroundSettings = pgTable(
  "background_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar({ length: 40 }).notNull().default("global"),
    sectionKey: varchar({ length: 40 }),
    value: jsonb().notNull(),
    updatedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("background_settings_scope_key").on(table.scope, table.sectionKey)],
);

export const animationSettings = pgTable(
  "animation_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar({ length: 40 }).notNull().default("global"),
    value: jsonb().notNull(),
    updatedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("animation_settings_scope_key").on(table.scope)],
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar({ length: 40 }).notNull(),
    label: varchar({ length: 80 }).notNull(),
    navLabel: varchar({ length: 40 }),
    anchor: varchar({ length: 40 }).notNull(),
    eyebrow: varchar({ length: 80 }),
    heading: varchar({ length: 200 }),
    description: text(),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    showInNav: boolean().notNull().default(false),
    backgroundOverride: jsonb(),
    animationType: varchar({ length: 40 }),
    ...timestamps,
  },
  (table) => [uniqueIndex("sections_key_key").on(table.key)],
);

export const sectionContent = pgTable(
  "section_content",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid()
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    fieldKey: varchar({ length: 60 }).notNull(),
    value: jsonb().notNull(),
    position: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [uniqueIndex("section_content_unique").on(table.sectionId, table.fieldKey)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar({ length: 120 }).notNull(),
    title: varchar({ length: 160 }).notNull(),
    shortDescription: varchar({ length: 320 }).notNull(),
    fullDescription: text().notNull(),
    problem: text(),
    solution: text(),
    architecture: text(),
    outcome: text(),
    features: jsonb().notNull().default(sql`'[]'::jsonb`),
    status: publishStatus().notNull().default("draft"),
    stage: projectStage().notNull().default("in-development"),
    isFeatured: boolean().notNull().default(false),
    position: integer().notNull().default(0),
    coverImageUrl: text(),
    architectureImageUrl: text(),
    demoUrl: text(),
    repoUrl: text(),
    seoTitle: varchar({ length: 200 }),
    seoDescription: varchar({ length: 320 }),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_slug_key").on(table.slug),
    index("projects_status_position_idx").on(table.status, table.position),
    index("projects_featured_idx").on(table.isFeatured),
  ],
);

export const skillCategories = pgTable(
  "skill_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar({ length: 60 }).notNull(),
    title: varchar({ length: 80 }).notNull(),
    description: varchar({ length: 320 }),
    icon: varchar({ length: 40 }),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("skill_categories_key_key").on(table.key)],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid()
      .notNull()
      .references(() => skillCategories.id, { onDelete: "cascade" }),
    label: varchar({ length: 80 }).notNull(),
    note: varchar({ length: 160 }),
    position: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [index("skills_category_idx").on(table.categoryId, table.position)],
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar({ length: 80 }).notNull(),
    name: varchar({ length: 80 }).notNull(),
    description: varchar({ length: 320 }),
    iconUrl: text(),
    categoryId: uuid().references(() => skillCategories.id, { onDelete: "set null" }),
    websiteUrl: text(),
    isFeatured: boolean().notNull().default(false),
    isVisible: boolean().notNull().default(true),
    position: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("technologies_slug_key").on(table.slug),
    index("technologies_position_idx").on(table.position),
  ],
);

export const projectImages = pgTable(
  "project_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    url: text().notNull(),
    alt: varchar({ length: 220 }).notNull(),
    caption: varchar({ length: 220 }),
    position: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [index("project_images_project_idx").on(table.projectId, table.position)],
);

export const projectTechnologies = pgTable(
  "project_technologies",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    technologyId: uuid()
      .notNull()
      .references(() => technologies.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.projectId, table.technologyId] })],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar({ length: 120 }).notNull(),
    title: varchar({ length: 120 }).notNull(),
    summary: varchar({ length: 320 }).notNull(),
    description: text(),
    deliverables: jsonb().notNull().default(sql`'[]'::jsonb`),
    icon: varchar({ length: 40 }),
    ctaLabel: varchar({ length: 60 }),
    ctaHref: varchar({ length: 200 }),
    priceLabel: varchar({ length: 80 }),
    showPrice: boolean().notNull().default(false),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("services_slug_key").on(table.slug)],
);

export type ExperienceKind = "work" | "education" | "certification";

export const experience = pgTable(
  "experience",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: varchar({ length: 20 }).notNull().default("work"),
    role: varchar({ length: 140 }).notNull(),
    organization: varchar({ length: 140 }).notNull(),
    location: varchar({ length: 120 }),
    description: text(),
    highlights: jsonb().notNull().default(sql`'[]'::jsonb`),
    startDate: varchar({ length: 7 }).notNull(),
    endDate: varchar({ length: 7 }),
    isCurrent: boolean().notNull().default(false),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index("experience_kind_position_idx").on(table.kind, table.position)],
);

export const education = pgTable(
  "education",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  institution: varchar({ length: 160 }).notNull(),
  program: varchar({ length: 160 }).notNull(),
  location: varchar({ length: 120 }),
  startYear: varchar({ length: 4 }).notNull(),
  endYear: varchar({ length: 4 }),
  summary: text(),
  position: integer().notNull().default(0),
  isVisible: boolean().notNull().default(true),
  ...timestamps,
  },
);

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorName: varchar({ length: 120 }).notNull(),
  authorRole: varchar({ length: 140 }),
  company: varchar({ length: 140 }),
  quote: text().notNull(),
  avatarUrl: text(),
  isVerified: boolean().notNull().default(false),
  isVisible: boolean().notNull().default(false),
  position: integer().notNull().default(0),
  ...timestamps,
});

export const socialLinks = pgTable(
  "social_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: varchar({ length: 40 }).notNull(),
    label: varchar({ length: 60 }).notNull(),
    url: text().notNull(),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("social_links_platform_key").on(table.platform)],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fileName: varchar({ length: 255 }).notNull(),
    originalName: varchar({ length: 255 }).notNull(),
    url: text().notNull(),
    kind: mediaKind().notNull().default("image"),
    mimeType: varchar({ length: 120 }).notNull(),
    sizeBytes: integer().notNull(),
    width: integer(),
    height: integer(),
    alt: varchar({ length: 220 }),
    storageDriver: varchar({ length: 20 }).notNull(),
    checksum: varchar({ length: 64 }),
    uploadedBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("media_assets_kind_idx").on(table.kind),
    index("media_assets_checksum_idx").on(table.checksum),
  ],
);

export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar({ length: 120 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    company: varchar({ length: 160 }),
    projectType: varchar({ length: 80 }),
    budgetRange: varchar({ length: 60 }),
    timeline: varchar({ length: 60 }),
    message: text().notNull(),
    status: inquiryStatus().notNull().default("new"),
    isRead: boolean().notNull().default(false),
    source: varchar({ length: 60 }).notNull().default("website"),
    ipHash: varchar({ length: 64 }),
    userAgent: varchar({ length: 500 }),
    ...timestamps,
  },
  (table) => [
    index("inquiries_status_idx").on(table.status, table.createdAt),
    index("inquiries_read_idx").on(table.isRead),
    index("inquiries_created_idx").on(table.createdAt),
  ],
);

export const inquiryNotes = pgTable(
  "inquiry_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inquiryId: uuid()
      .notNull()
      .references(() => contactInquiries.id, { onDelete: "cascade" }),
    adminId: uuid().references(() => admins.id, { onDelete: "set null" }),
    body: text().notNull(),
    ...timestamps,
  },
  (table) => [index("inquiry_notes_inquiry_idx").on(table.inquiryId, table.createdAt)],
);

export const aiAssistantSettings = pgTable(
  "ai_assistant_settings",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  isEnabled: boolean().notNull().default(false),
  provider: varchar({ length: 40 }).notNull().default("openai-compatible"),
  model: varchar({ length: 80 }),
  systemInstructions: text(),
  welcomeMessage: text(),
  suggestedQuestions: jsonb().notNull().default(sql`'[]'::jsonb`),
  maxMessagesPerSession: integer().notNull().default(12),
  rateLimitPerHour: integer().notNull().default(30),
  fallbackEnabled: boolean().notNull().default(true),
  ...timestamps,
  },
  (table) => [uniqueIndex("ai_assistant_settings_singleton").on(table.provider)],
);

export const aiKnowledgeEntries = pgTable(
  "ai_knowledge_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: varchar({ length: 300 }).notNull(),
    answer: text().notNull(),
    tags: jsonb().notNull().default(sql`'[]'::jsonb`),
    position: integer().notNull().default(0),
    isVisible: boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [index("ai_knowledge_position_idx").on(table.position)],
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventType: varchar({ length: 40 }).notNull(),
    path: varchar({ length: 255 }),
    referrerHost: varchar({ length: 120 }),
    deviceCategory: varchar({ length: 20 }),
    country: varchar({ length: 2 }),
    visitorHash: varchar({ length: 64 }),
    metadata: jsonb(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("analytics_type_created_idx").on(table.eventType, table.createdAt),
    index("analytics_visitor_idx").on(table.visitorHash),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid().references(() => admins.id, { onDelete: "set null" }),
    action: varchar({ length: 80 }).notNull(),
    entity: varchar({ length: 60 }).notNull(),
    entityId: varchar({ length: 60 }),
    summary: varchar({ length: 300 }),
    metadata: jsonb(),
    ipHash: varchar({ length: 64 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_entity_idx").on(table.entity, table.entityId),
  ],
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entity: varchar({ length: 60 }).notNull(),
    entityId: varchar({ length: 60 }).notNull(),
    version: integer().notNull().default(1),
    snapshot: jsonb().notNull(),
    createdBy: uuid().references(() => admins.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("content_versions_unique").on(table.entity, table.entityId, table.version),
    index("content_versions_entity_idx").on(table.entity, table.entityId),
  ],
);

export const backupRecords = pgTable("backup_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: backupKind().notNull(),
  fileName: varchar({ length: 200 }).notNull(),
  url: text(),
  sizeBytes: integer(),
  tableCounts: jsonb(),
  notes: text(),
  createdBy: uuid().references(() => admins.id, { onDelete: "set null" }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar({ length: 255 }).notNull(),
    ipHash: varchar({ length: 64 }),
    succeeded: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("login_attempts_identifier_idx").on(table.identifier, table.createdAt)],
);

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: varchar({ length: 160 }).primaryKey(),
  count: integer().notNull().default(0),
  windowStart: timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
}));

export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
  technologies: many(technologies),
}));

export const technologiesRelations = relations(technologies, ({ one, many }) => ({
  category: one(skillCategories, {
    fields: [technologies.categoryId],
    references: [skillCategories.id],
  }),
  projects: many(projectTechnologies),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  images: many(projectImages),
  technologies: many(projectTechnologies),
}));

export const projectImagesRelations = relations(projectImages, ({ one }) => ({
  project: one(projects, { fields: [projectImages.projectId], references: [projects.id] }),
}));

export const projectTechnologiesRelations = relations(projectTechnologies, ({ one }) => ({
  project: one(projects, {
    fields: [projectTechnologies.projectId],
    references: [projects.id],
  }),
  technology: one(technologies, {
    fields: [projectTechnologies.technologyId],
    references: [technologies.id],
  }),
}));

export const inquiriesRelations = relations(contactInquiries, ({ many }) => ({
  notes: many(inquiryNotes),
}));

export const inquiryNotesRelations = relations(inquiryNotes, ({ one }) => ({
  inquiry: one(contactInquiries, {
    fields: [inquiryNotes.inquiryId],
    references: [contactInquiries.id],
  }),
}));

export const adminsRelations = relations(admins, ({ one, many }) => ({
  role: one(adminRoles, { fields: [admins.roleId], references: [adminRoles.id] }),
  sessions: many(adminSessions),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(admins, { fields: [adminSessions.adminId], references: [admins.id] }),
}));

export const adminRolesRelations = relations(adminRoles, ({ many }) => ({
  permissions: many(adminRolePermissions),
  admins: many(admins),
}));

export const adminRolePermissionsRelations = relations(adminRolePermissions, ({ one }) => ({
  role: one(adminRoles, {
    fields: [adminRolePermissions.roleId],
    references: [adminRoles.id],
  }),
  permission: one(adminPermissions, {
    fields: [adminRolePermissions.permissionId],
    references: [adminPermissions.id],
  }),
}));

export const sectionsRelations = relations(sections, ({ many }) => ({
  content: many(sectionContent),
}));

export const sectionContentRelations = relations(sectionContent, ({ one }) => ({
  section: one(sections, { fields: [sectionContent.sectionId], references: [sections.id] }),
}));

export type Admin = typeof admins.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Technology = typeof technologies.$inferSelect;
export type SkillCategory = typeof skillCategories.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
