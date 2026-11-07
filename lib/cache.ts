import { revalidatePath, revalidateTag } from "next/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";

const PROFILE = "max";

export function bumpTags(...tags: string[]) {
  const unique = new Set<string>([CONFIG_TAGS.content, ...tags]);

  for (const tag of unique) {
    try {
      revalidateTag(tag, PROFILE);
    } catch {
      // outside a request scope the tag call is a no-op
    }
  }

  bumpPaths("/", "/work", "/sitemap.xml");
}

// Public routes are prerendered, so the route cache needs an explicit purge;
// tag invalidation alone leaves the HTML stale.
export function bumpPaths(...paths: string[]) {
  for (const path of new Set(paths)) {
    try {
      revalidatePath(path);
    } catch {
      // same
    }
  }
}
