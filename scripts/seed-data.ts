import { defaultSiteSettings } from "../lib/config/site";
import { defaultDesignConfig } from "../lib/config/design";
import { defaultAnimationConfig } from "../lib/config/animation";
import { defaultPortraitConfig } from "../lib/config/portrait";
import { defaultPatternConfig } from "../lib/config/background";

const flagged = (copy: string) => `${copy} [REVIEW]`;

export const sectionSeed = [
  {
    key: "hero",
    label: "Hero",
    navLabel: "Home",
    anchor: "home",
    eyebrow: "AI Automation Engineer",
    heading: "Building intelligence.\nAutomating the future.",
    highlightWords: ["intelligence.", "future."],
    description:
      "I build intelligent AI agents, automation systems, and scalable digital solutions that help businesses eliminate repetitive work and operate smarter.",
    position: 0,
    showInNav: true,
    fields: {
      primaryCta: { label: "Explore my work", href: "#work" },
      secondaryCta: { label: "Let's build something", href: "#contact" },
      hudLabels: [
        { label: "SYSTEM", value: "ONLINE" },
        { label: "STACK", value: "AGENTS / RPA / API" },
        { label: "BASE", value: "KARACHI, PK" },
      ],
      scrollLabel: "Scroll to explore",
    },
  },
  {
    key: "about",
    label: "About",
    navLabel: "About",
    anchor: "about",
    eyebrow: "PROFILE",
    heading: "Engineering that removes the busywork",
    description: flagged(
      "I am an AI automation engineer working at the intersection of applied AI and business operations. Most teams lose hours to hand-offs, spreadsheets and copy-paste. I design systems that remove that layer.",
    ),
    position: 1,
    showInNav: true,
    fields: {
      philosophy:
        "Automation should be boring in the best way: predictable, observable, and easy to hand over. If a workflow cannot be explained to the person running it, it is not finished.",
      highlights: [
        "Agent workflows with human checkpoints",
        "Workflow automation across existing SaaS tools",
        "APIs and data layers that stay maintainable",
      ],
      stats: [],
    },
  },
  {
    key: "expertise",
    label: "Expertise",
    navLabel: "Expertise",
    anchor: "expertise",
    eyebrow: "CAPABILITIES",
    heading: "Capability map",
    description: "Where I plug into a team, from agent design to deployment.",
    position: 2,
    showInNav: true,
    fields: {},
  },
  {
    key: "projects",
    label: "Projects",
    navLabel: "Work",
    anchor: "work",
    eyebrow: "SELECTED WORK",
    heading: "Selected systems",
    description: "Case studies are written as engineering records: problem, architecture, implementation.",
    position: 3,
    showInNav: true,
    fields: {},
  },
  {
    key: "services",
    label: "Services",
    navLabel: "Services",
    anchor: "services",
    eyebrow: "SERVICES",
    heading: "What I build",
    description: "Scoped engagements, delivered as working systems rather than slide decks.",
    position: 4,
    showInNav: true,
    fields: {},
  },
  {
    key: "stack",
    label: "Technology",
    navLabel: "Stack",
    anchor: "stack",
    eyebrow: "STACK",
    heading: "Technology ecosystem",
    description: "Tools I reach for, grouped by the problem they solve.",
    position: 5,
    showInNav: true,
    fields: {},
  },
  {
    key: "process",
    label: "Process",
    navLabel: "Process",
    anchor: "process",
    eyebrow: "PROCESS",
    heading: "How the work happens",
    description: "Five stages, each with a reviewable artifact.",
    position: 6,
    showInNav: true,
    fields: {},
  },
  {
    key: "contact",
    label: "Contact",
    navLabel: "Contact",
    anchor: "contact",
    eyebrow: "CONTACT",
    heading: "Let's build something",
    description: "A short brief is enough: what is manual today, and what should happen instead.",
    position: 7,
    showInNav: true,
    fields: {
      responseTime: "Usually replies within 24 hours",
      projectTypes: [
        "AI agent",
        "Business automation",
        "API integration",
        "Custom software",
        "Not sure yet",
      ],
      budgetRanges: ["Under $1k", "$1k - $3k", "$3k - $8k", "$8k+", "Prefer to discuss"],
      timelines: ["ASAP", "2-4 weeks", "1-2 months", "Flexible"],
    },
  },
];

export const skillCategorySeed = [
  {
    key: "ai-engineering",
    title: "AI Engineering",
    description: "Agent design, retrieval, and controlled tool use.",
    icon: "brain",
    skills: ["AI agents", "LLM integration", "Prompt engineering", "AI assistants", "Agent workflows"],
  },
  {
    key: "business-automation",
    title: "Business Automation",
    description: "Workflow platforms wired into real business systems.",
    icon: "workflow",
    skills: ["n8n", "Make", "Activepieces", "Zapier", "Workflow engineering"],
  },
  {
    key: "backend-engineering",
    title: "Backend Engineering",
    description: "Services, schedulers, and APIs that stay up.",
    icon: "server",
    skills: ["Python", "Flask", "FastAPI", "REST APIs"],
  },
  {
    key: "frontend-engineering",
    title: "Frontend Engineering",
    description: "Fast interfaces with real state handling.",
    icon: "layout",
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  },
  {
    key: "databases",
    title: "Databases",
    description: "Modelling, migrations, and query performance.",
    icon: "database",
    skills: ["PostgreSQL", "Supabase", "Neon", "Prisma / Drizzle"],
  },
  {
    key: "infrastructure",
    title: "Infrastructure",
    description: "Version control, deployment, and observability.",
    icon: "git-branch",
    skills: ["Git", "GitHub", "Vercel", "Cloud deployment"],
  },
];

export const technologySeed = [
  { name: "Next.js", category: "frontend-engineering", featured: true, website: "https://nextjs.org" },
  { name: "React", category: "frontend-engineering", featured: false, website: "https://react.dev" },
  { name: "TypeScript", category: "frontend-engineering", featured: true, website: "https://typescriptlang.org" },
  { name: "Tailwind CSS", category: "frontend-engineering", featured: false, website: "https://tailwindcss.com" },
  { name: "Python", category: "backend-engineering", featured: true, website: "https://python.org" },
  { name: "FastAPI", category: "backend-engineering", featured: false, website: "https://fastapi.tiangolo.com" },
  { name: "Flask", category: "backend-engineering", featured: false, website: "https://flask.palletsprojects.com" },
  { name: "PostgreSQL", category: "databases", featured: true, website: "https://postgresql.org" },
  { name: "Neon", category: "databases", featured: false, website: "https://neon.tech" },
  { name: "Supabase", category: "databases", featured: false, website: "https://supabase.com" },
  { name: "Drizzle ORM", category: "databases", featured: false, website: "https://orm.drizzle.team" },
  { name: "n8n", category: "business-automation", featured: true, website: "https://n8n.io" },
  { name: "Make", category: "business-automation", featured: false, website: "https://make.com" },
  { name: "Activepieces", category: "business-automation", featured: false, website: "https://activepieces.com" },
  { name: "Zapier", category: "business-automation", featured: false, website: "https://zapier.com" },
  { name: "Vercel", category: "infrastructure", featured: false, website: "https://vercel.com" },
  { name: "GitHub", category: "infrastructure", featured: false, website: "https://github.com" },
  { name: "OpenAI API", category: "ai-engineering", featured: true, website: "https://platform.openai.com" },
];

export const projectSeed = [
  {
    slug: "omniflow",
    title: "OmniFlow",
    shortDescription:
      "AI-powered business automation platform for routing requests through agent-assisted workflows.",
    fullDescription: flagged(
      "OmniFlow is a business automation platform that combines workflow orchestration with AI agents. Requests enter through a single intake layer, are classified, enriched, then routed into deterministic business workflows with agent steps where language understanding is required.",
    ),
    problem:
      "Operations teams were triaging inbound requests manually, moving data between tools by hand and losing context between systems.",
    solution:
      "A single intake pipeline with an agent-assisted classification step, typed workflow definitions, and an audit trail for every state transition.",
    architecture:
      "Next.js dashboard, Python service layer for workflow execution, PostgreSQL for state, queue-backed agent steps, and webhook adapters for third-party tools.",
    features: [
      "Workflow definitions with typed steps",
      "Agent steps with human approval checkpoints",
      "Execution history and retry handling",
      "Tool adapters for common business SaaS",
    ],
    stack: ["Next.js", "TypeScript", "Python", "PostgreSQL", "OpenAI API"],
    status: "published",
    stage: "in-development",
    featured: true,
    position: 0,
  },
  {
    slug: "omni-assistant",
    title: "Omni-Assistant",
    shortDescription:
      "Local-first hybrid personal AI assistant with tools, memory, and autonomous execution.",
    fullDescription: flagged(
      "Omni-Assistant runs locally first and falls back to hosted models only when required. It exposes a small tool surface (files, shell-safe actions, calendar, notes) behind an approval layer, with memory stored as structured records instead of a single prompt blob.",
    ),
    problem:
      "Assistants that only generate text are not useful for real tasks, and assistants with unrestricted tool access are not safe to run on a personal machine.",
    solution:
      "An approval-gated tool layer, explicit memory schema, and a local-first inference path that degrades to remote models on demand.",
    architecture:
      "Electron-free local daemon in Python, SQLite memory store with structured entities, tool registry with per-tool permission scopes, and an optional remote model bridge.",
    features: [
      "Local-first inference with remote fallback",
      "Structured memory (entities, not transcripts)",
      "Tool registry with approval scopes",
      "Task queue for multi-step execution",
    ],
    stack: ["Python", "FastAPI", "PostgreSQL", "React"],
    status: "published",
    stage: "in-development",
    featured: true,
    position: 1,
  },
  {
    slug: "ecommerce-platform",
    title: "E-commerce Platform",
    shortDescription:
      "Scalable commerce application with the operational tooling a store actually needs.",
    fullDescription: flagged(
      "A commerce platform built around catalogue, inventory and order lifecycle. The focus is the operational layer: stock movements, order state transitions, and integrations with delivery and payment providers.",
    ),
    problem:
      "Small stores outgrow hosted builders but cannot justify a full engineering team, so inventory and orders end up in spreadsheets.",
    solution:
      "A typed domain model for products, variants and orders, with explicit state transitions and an integration boundary for payments and logistics.",
    architecture:
      "Next.js storefront, FastAPI service layer, PostgreSQL with normalised inventory tables, background workers for order events.",
    features: [
      "Catalogue and variant modelling",
      "Order state machine with audit trail",
      "Inventory movements instead of mutable counts",
      "Payment and logistics provider adapters",
    ],
    stack: ["Next.js", "TypeScript", "FastAPI", "PostgreSQL"],
    status: "published",
    stage: "concept",
    featured: true,
    position: 2,
  },
  {
    slug: "business-automation-systems",
    title: "Business Automation Systems",
    shortDescription:
      "Workflow automation, API integrations, and intelligent business processes delivered per client.",
    fullDescription: flagged(
      "A delivery format rather than a single product: mapping a manual process, defining the target workflow, and shipping the integrations and reconciliation jobs that keep it correct over time.",
    ),
    problem:
      "Repetitive operational work spread across email, spreadsheets and CRM tools, with no single source of truth.",
    solution:
      "Documented process maps, n8n and Make workflows with idempotent steps, and reconciliation jobs that raise exceptions instead of failing silently.",
    architecture:
      "n8n / Make orchestration, Python workers for data heavy steps, Postgres for state, alerting on exceptions.",
    features: [
      "Process mapping before implementation",
      "Idempotent workflow design",
      "Exception queues instead of silent failures",
      "Handover documentation per workflow",
    ],
    stack: ["n8n", "Make", "Python", "PostgreSQL"],
    status: "published",
    stage: "live",
    featured: false,
    position: 3,
  },
];

export const serviceSeed = [
  {
    slug: "custom-ai-agents",
    title: "Custom AI Agents",
    summary: "Task-specific agents with defined tools, guardrails, and evaluation.",
    deliverables: ["Agent design document", "Tool integration", "Evaluation set"],
    icon: "bot",
  },
  {
    slug: "ai-chatbots",
    title: "AI Chatbots",
    summary: "Support and sales assistants grounded in your own data.",
    deliverables: ["Knowledge ingestion", "Deployed chat surface", "Answer quality review"],
    icon: "message-circle",
  },
  {
    slug: "business-process-automation",
    title: "Business Process Automation",
    summary: "Manual, multi-tool processes turned into reliable workflows.",
    deliverables: ["Process map", "Automated workflow", "Runbook"],
    icon: "workflow",
  },
  {
    slug: "api-integrations",
    title: "API Integrations",
    summary: "Systems that finally talk to each other, with error handling that holds.",
    deliverables: ["Integration spec", "Implementation", "Monitoring hooks"],
    icon: "plug",
  },
  {
    slug: "lead-generation-automation",
    title: "Lead Generation Automation",
    summary: "Sourcing, enrichment, and routing pipelines that respect data rules.",
    deliverables: ["Sourcing pipeline", "Enrichment step", "CRM routing"],
    icon: "target",
  },
  {
    slug: "customer-support-automation",
    title: "Customer Support Automation",
    summary: "Triage, drafting, and escalation handled by a workflow your team can trust.",
    deliverables: ["Triage logic", "Draft assistance", "Escalation rules"],
    icon: "headphones",
  },
  {
    slug: "ecommerce-automation",
    title: "E-commerce Automation",
    summary: "Inventory, orders, and fulfilment events kept in sync automatically.",
    deliverables: ["Store integrations", "Order sync", "Exception alerts"],
    icon: "shopping-bag",
  },
  {
    slug: "custom-software",
    title: "Custom Software Solutions",
    summary: "Internal tools and services when automation alone is not the right shape.",
    deliverables: ["Technical spec", "Application build", "Deployment"],
    icon: "code",
  },
];

export const processSeed = [
  { step: "01", title: "Discover", description: "Understand business requirements.", position: 0 },
  { step: "02", title: "Architect", description: "Design the system and workflow.", position: 1 },
  { step: "03", title: "Engineer", description: "Develop and integrate components.", position: 2 },
  { step: "04", title: "Validate", description: "Test functionality and reliability.", position: 3 },
  { step: "05", title: "Deploy", description: "Deliver and maintain the solution.", position: 4 },
];

export const experienceSeed = [
  {
    kind: "work",
    role: flagged("AI Automation Engineer"),
    organization: flagged("Independent"),
    location: "Karachi, Pakistan",
    description:
      "Designing and shipping automation systems and AI agents for small and mid-sized businesses.",
    highlights: ["Workflow automation", "Agent systems", "API integrations"],
    startDate: "2023-01",
    isCurrent: true,
    position: 0,
  },
];

// Empty by design. Education content is entered by the owner in /admin/education:
// seeding an institution that was never confirmed would publish a fact that is not true.
export const educationSeed: {
  institution: string;
  program: string;
  startYear: string;
  endYear: string | null;
  position: number;
}[] = [];

export const knowledgeSeed = [
  {
    question: "Who is Ahmed Ansari?",
    answer:
      "Ahmed Ansari is an AI automation engineer based in Karachi. He builds AI agents, business automation workflows, and the APIs and interfaces around them.",
    tags: ["intro", "about"],
  },
  {
    question: "What technologies does he use?",
    answer:
      "Python and FastAPI on the service side, Next.js and TypeScript on the front end, PostgreSQL for data, and n8n, Make or Activepieces for workflow automation.",
    tags: ["stack"],
  },
  {
    question: "What services does he offer?",
    answer:
      "Custom AI agents, AI chatbots, business process automation, API integrations, lead generation automation, support automation, e-commerce automation, and custom software.",
    tags: ["services"],
  },
  {
    question: "How can I hire him?",
    answer:
      "Use the contact form on this site with a short description of the process you want automated. He replies with a technical point of view and a scope.",
    tags: ["contact"],
  },
];

export const seedConfig = {
  site: defaultSiteSettings,
  design: defaultDesignConfig,
  animation: defaultAnimationConfig,
  portrait: defaultPortraitConfig,
  pattern: defaultPatternConfig,
};
