import { env } from "@/lib/env";
import { createBlobDriver } from "@/lib/storage/blob";
import { createLocalDriver } from "@/lib/storage/local";
import type { StorageDriver } from "@/lib/storage/types";

let cached: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (cached) return cached;

  if (env.STORAGE_DRIVER === "blob" && env.BLOB_READ_WRITE_TOKEN) {
    cached = createBlobDriver(env.BLOB_READ_WRITE_TOKEN);
  } else {
    cached = createLocalDriver();
  }

  return cached;
}

export * from "@/lib/storage/types";
