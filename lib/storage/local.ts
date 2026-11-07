import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageDriver } from "@/lib/storage/types";

const ROOT = join(process.cwd(), "public", "uploads");

export function createLocalDriver(): StorageDriver {
  return {
    name: "local",
    async put({ key, body }) {
      const target = join(ROOT, key);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      return { key, url: `/uploads/${key}`, size: body.byteLength };
    },
    async remove(key) {
      await unlink(join(ROOT, key)).catch(() => undefined);
    },
    publicUrl(key) {
      return `/uploads/${key}`;
    },
  };
}
