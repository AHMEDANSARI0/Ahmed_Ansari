import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Expertise } from "@/components/sections/expertise";
import { Projects } from "@/components/sections/projects";
import { Services } from "@/components/sections/services";
import { Stack } from "@/components/sections/stack";
import { Process } from "@/components/sections/process";
import { Contact } from "@/components/sections/contact";
import {
  getEducation,
  getExpertise,
  getProjectCards,
  getSections,
  getServices,
  getStack,
  parseAbout,
  parseContact,
  parseHero,
  parseProcess,
  sectionByKey,
  visibleSections,
  withSectionAnimations,
} from "@/lib/services/content";
import {
  getAnimationSettings,
  getPortraitSettings,
  getSiteSettings,
} from "@/lib/services/settings";
import { buildMetadata, personJsonLd } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata({
    title: `${settings.siteName} — ${settings.role}`,
    description:
      "AI automation engineer building intelligent agents, business automation systems, and scalable digital products.",
    path: "/",
    site: settings,
  });
}

export default async function HomePage() {
  const [
    sections,
    settings,
    baseAnimation,
    portrait,
    projects,
    expertise,
    services,
    stack,
    education,
  ] = await Promise.all([
    getSections(),
    getSiteSettings(),
    getAnimationSettings(),
    getPortraitSettings(),
    getProjectCards(),
    getExpertise(),
    getServices(),
    getStack(),
    getEducation(),
  ]);

  const ordered = visibleSections(sections);
  const animation = withSectionAnimations(baseAnimation, sections);
  const sectionType = (key: string) => animation.sections[key];

  const hero = sectionByKey(sections, "hero");
  const about = sectionByKey(sections, "about");
  const expertiseSection = sectionByKey(sections, "expertise");
  const projectsSection = sectionByKey(sections, "projects");
  const servicesSection = sectionByKey(sections, "services");
  const stackSection = sectionByKey(sections, "stack");
  const processSection = sectionByKey(sections, "process");
  const contactSection = sectionByKey(sections, "contact");

  const blocks: Record<string, React.ReactNode> = {
    hero: (
      <Hero
        key="hero"
        content={parseHero(hero)}
        settings={settings}
        animation={animation}
        sectionType={sectionType("hero")}
        portrait={portrait}
      />
    ),
    about: (
      <About
        key="about"
        section={about}
        content={parseAbout(about)}
        animation={animation}
        sectionType={sectionType("about")}
        settings={settings}
        education={education}
      />
    ),
    expertise: (
      <Expertise
        key="expertise"
        section={expertiseSection}
        categories={expertise}
        animation={animation}
        sectionType={sectionType("expertise")}
      />
    ),
    projects: (
      <Projects
        key="projects"
        section={projectsSection}
        projects={projects}
        animation={animation}
        sectionType={sectionType("projects")}
      />
    ),
    services: (
      <Services
        key="services"
        section={servicesSection}
        services={services}
        animation={animation}
        sectionType={sectionType("services")}
      />
    ),
    stack: (
      <Stack
        key="stack"
        section={stackSection}
        items={stack}
        animation={animation}
        sectionType={sectionType("stack")}
      />
    ),
    process: (
      <Process
        key="process"
        section={processSection}
        steps={parseProcess(processSection)}
        animation={animation}
        sectionType={sectionType("process")}
      />
    ),
    contact: (
      <Contact
        key="contact"
        section={contactSection}
        content={parseContact(contactSection)}
        animation={animation}
        sectionType={sectionType("contact")}
        settings={settings}
      />
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(settings)) }}
      />
      {ordered.map((section) => blocks[section.key] ?? null)}
    </>
  );
}
