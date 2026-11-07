import { withClient } from "./db-utils";
import {
  educationSeed,
  experienceSeed,
  knowledgeSeed,
  projectSeed,
  sectionSeed,
  seedConfig,
  serviceSeed,
  skillCategorySeed,
  technologySeed,
} from "./seed-data";

const permissions = [
  ["dashboard.view", "View dashboard", "dashboard"],
  ["content.edit", "Edit content", "content"],
  ["content.publish", "Publish content", "content"],
  ["projects.manage", "Manage projects", "content"],
  ["media.manage", "Manage media", "media"],
  ["inquiries.view", "View inquiries", "crm"],
  ["inquiries.manage", "Manage inquiries", "crm"],
  ["analytics.view", "View analytics", "analytics"],
  ["settings.manage", "Manage settings", "settings"],
  ["users.manage", "Manage admin users", "settings"],
  ["backup.manage", "Backup and restore", "settings"],
  ["audit.view", "View audit log", "security"],
] as const;

const roles = [
  ["owner", "Owner", "Full access to every module."],
  ["editor", "Editor", "Can edit and publish content, projects, media, and leads."],
  ["viewer", "Viewer", "Read-only access to dashboard, leads, and analytics."],
] as const;

const rolePermissionMap: Record<string, string[]> = {
  owner: permissions.map(([key]) => key),
  editor: [
    "dashboard.view",
    "content.edit",
    "projects.manage",
    "media.manage",
    "inquiries.view",
    "inquiries.manage",
    "analytics.view",
  ],
  viewer: ["dashboard.view", "inquiries.view", "analytics.view"],
};

const processSteps = [
  { step: "01", title: "Discover", description: "Understand business requirements." },
  { step: "02", title: "Architect", description: "Design the system and workflow." },
  { step: "03", title: "Engineer", description: "Develop and integrate components." },
  { step: "04", title: "Validate", description: "Test functionality and reliability." },
  { step: "05", title: "Deploy", description: "Deliver and maintain the solution." },
];

async function seed() {
  await withClient(async (db) => {
    for (const [key, label, description] of roles) {
      await db.query(
        `insert into admin_roles (key, label, description) values ($1, $2, $3)
         on conflict (key) do update set label = excluded.label, description = excluded.description`,
        [key, label, description],
      );
    }

    for (const [key, label, group] of permissions) {
      await db.query(
        `insert into admin_permissions (key, label, "group") values ($1, $2, $3)
         on conflict (key) do update set label = excluded.label, "group" = excluded."group"`,
        [key, label, group],
      );
    }

    for (const [roleKey, perms] of Object.entries(rolePermissionMap)) {
      const roleRows = await db.query(`select id from admin_roles where key = $1`, [roleKey]);
      const roleId = roleRows[0]?.id as string | undefined;
      if (!roleId) continue;
      await db.query(`delete from admin_role_permissions where role_id = $1`, [roleId]);
      for (const perm of perms) {
        await db.query(
          `insert into admin_role_permissions (role_id, permission_id)
           select $1, id from admin_permissions where key = $2
           on conflict do nothing`,
          [roleId, perm],
        );
      }
    }

    const settingsEntries: [string, unknown][] = [
      ["global", seedConfig.site],
      ["design", seedConfig.design],
      ["animation", seedConfig.animation],
      ["portrait", seedConfig.portrait],
    ];

    for (const [key, value] of settingsEntries) {
      await db.query(
        `insert into site_settings (key, value) values ($1, $2::jsonb)
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }

    await db.query(
      `insert into theme_settings (scope, value) values ('global', $1::jsonb)
       on conflict (scope) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify(seedConfig.design)],
    );

    await db.query(
      `insert into animation_settings (scope, value) values ('global', $1::jsonb)
       on conflict (scope) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify(seedConfig.animation)],
    );

    await db.query(
      `insert into background_settings (scope, section_key, value) values ('global', null, $1::jsonb)
       on conflict (scope, section_key) do update set value = excluded.value, updated_at = now()`,
      [JSON.stringify(seedConfig.pattern)],
    );

    for (const section of sectionSeed) {
      const rows = await db.query(
        `insert into sections (key, label, nav_label, anchor, eyebrow, heading, description, position, show_in_nav, animation_type)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (key) do update set
           label = excluded.label,
           nav_label = excluded.nav_label,
           anchor = excluded.anchor,
           eyebrow = excluded.eyebrow,
           heading = excluded.heading,
           description = excluded.description,
           position = excluded.position,
           show_in_nav = excluded.show_in_nav
         returning id`,
        [
          section.key,
          section.label,
          section.navLabel,
          section.anchor,
          section.eyebrow,
          section.heading,
          section.description,
          section.position,
          section.showInNav,
          seedConfig.animation.sections[section.key] ?? "fade-up",
        ],
      );
      const sectionId = rows[0]?.id as string | undefined;
      if (!sectionId) continue;

      const fields: Record<string, unknown> = { ...section.fields };
      if (section.key === "process") fields.steps = processSteps;

      for (const [fieldKey, value] of Object.entries(fields)) {
        await db.query(
          `insert into section_content (section_id, field_key, value) values ($1, $2, $3::jsonb)
           on conflict (section_id, field_key) do update set value = excluded.value, updated_at = now()`,
          [sectionId, fieldKey, JSON.stringify(value)],
        );
      }
    }

    for (const [index, category] of skillCategorySeed.entries()) {
      const rows = await db.query(
        `insert into skill_categories (key, title, description, icon, position)
         values ($1, $2, $3, $4, $5)
         on conflict (key) do update set
           title = excluded.title, description = excluded.description,
           icon = excluded.icon, position = excluded.position
         returning id`,
        [category.key, category.title, category.description, category.icon, index],
      );
      const categoryId = rows[0]?.id as string | undefined;
      if (!categoryId) continue;

      for (const [skillIndex, label] of category.skills.entries()) {
        const existing = await db.query(
          `select id from skills where category_id = $1 and label = $2 limit 1`,
          [categoryId, label],
        );
        if (existing.length === 0) {
          await db.query(
            `insert into skills (category_id, label, position) values ($1, $2, $3)`,
            [categoryId, label, skillIndex],
          );
        }
      }
    }

    for (const [index, tech] of technologySeed.entries()) {
      const slug = tech.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      const categoryRows = await db.query(`select id from skill_categories where key = $1`, [
        tech.category,
      ]);
      await db.query(
        `insert into technologies (slug, name, category_id, website_url, is_featured, position)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (slug) do update set
           name = excluded.name, category_id = excluded.category_id,
           website_url = excluded.website_url, is_featured = excluded.is_featured,
           position = excluded.position`,
        [slug, tech.name, categoryRows[0]?.id ?? null, tech.website, tech.featured, index],
      );
    }

    for (const project of projectSeed) {
      const rows = await db.query(
        `insert into projects
           (slug, title, short_description, full_description, problem, solution, architecture,
            features, status, stage, is_featured, position, published_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::publish_status, $10::project_stage, $11, $12, now())
         on conflict (slug) do update set
           title = excluded.title,
           short_description = excluded.short_description,
           full_description = excluded.full_description,
           problem = excluded.problem,
           solution = excluded.solution,
           architecture = excluded.architecture,
           features = excluded.features,
           status = excluded.status,
           stage = excluded.stage,
           is_featured = excluded.is_featured,
           position = excluded.position,
           updated_at = now()
         returning id`,
        [
          project.slug,
          project.title,
          project.shortDescription,
          project.fullDescription,
          project.problem,
          project.solution,
          project.architecture,
          JSON.stringify(project.features),
          project.status,
          project.stage,
          project.featured,
          project.position,
        ],
      );
      const projectId = rows[0]?.id as string | undefined;
      if (!projectId) continue;

      for (const techName of project.stack) {
        const techSlug = techName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
        const techRows = await db.query(`select id from technologies where slug = $1 limit 1`, [
          techSlug,
        ]);
        const techId = techRows[0]?.id as string | undefined;
        if (!techId) continue;
        await db.query(
          `insert into project_technologies (project_id, technology_id) values ($1, $2)
           on conflict do nothing`,
          [projectId, techId],
        );
      }
    }

    for (const [index, service] of serviceSeed.entries()) {
      await db.query(
        `insert into services (slug, title, summary, deliverables, icon, cta_label, cta_href, position)
         values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
         on conflict (slug) do update set
           title = excluded.title, summary = excluded.summary,
           deliverables = excluded.deliverables, icon = excluded.icon,
           cta_label = excluded.cta_label, cta_href = excluded.cta_href,
           position = excluded.position`,
        [
          service.slug,
          service.title,
          service.summary,
          JSON.stringify(service.deliverables),
          service.icon,
          "Discuss this",
          "#contact",
          index,
        ],
      );
    }

    for (const entry of experienceSeed) {
      const existing = await db.query(`select id from experience where role = $1 limit 1`, [
        entry.role,
      ]);
      if (existing.length === 0) {
        await db.query(
          `insert into experience
             (kind, role, organization, location, description, highlights, start_date, is_current, position)
           values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)`,
          [
            entry.kind,
            entry.role,
            entry.organization,
            entry.location,
            entry.description,
            JSON.stringify(entry.highlights),
            entry.startDate,
            entry.isCurrent,
            entry.position,
          ],
        );
      }
    }

    for (const entry of educationSeed) {
      const existing = await db.query(`select id from education where institution = $1 limit 1`, [
        entry.institution,
      ]);
      if (existing.length === 0) {
        await db.query(
          `insert into education (institution, program, start_year, end_year, position)
           values ($1, $2, $3, $4, $5)`,
          [entry.institution, entry.program, entry.startYear, entry.endYear, entry.position],
        );
      }
    }

    for (const [index, link] of seedConfig.site.socialLinks.entries()) {
      await db.query(
        `insert into social_links (platform, label, url, position, is_visible)
         values ($1, $2, $3, $4, $5)
         on conflict (platform) do update set
           label = excluded.label, url = excluded.url,
           position = excluded.position, is_visible = excluded.is_visible`,
        [link.platform, link.label, link.url, index, link.visible],
      );
    }

    for (const [index, entry] of knowledgeSeed.entries()) {
      const existing = await db.query(
        `select id from ai_knowledge_entries where question = $1 limit 1`,
        [entry.question],
      );
      if (existing.length === 0) {
        await db.query(
          `insert into ai_knowledge_entries (question, answer, tags, position)
           values ($1, $2, $3::jsonb, $4)`,
          [entry.question, entry.answer, JSON.stringify(entry.tags), index],
        );
      }
    }

    const assistantExists = await db.query(`select id from ai_assistant_settings limit 1`);
    if (assistantExists.length === 0) {
      await db.query(
        `insert into ai_assistant_settings
           (is_enabled, provider, model, system_instructions, welcome_message, suggested_questions)
         values ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          false,
          "openai-compatible",
          "gpt-4o-mini",
          "You answer questions about Ahmed Ansari using only the provided knowledge base. If the answer is not covered, say so and point to the contact form.",
          "Ask me about Ahmed's projects, stack, or how to start a project.",
          JSON.stringify([
            "What does Ahmed build?",
            "Which automation tools does he use?",
            "How do I start a project?",
          ]),
        ],
      );
    }

    for (const section of sectionSeed) {
      if (section.showInNav) {
        await db.query(`update sections set show_in_nav = true where key = $1`, [section.key]);
      }
    }

    console.log("Seed complete.");
  });
}

seed().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
