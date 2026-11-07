import { del, put } from "@vercel/blob";
import type { StorageDriver } from "@/lib/storage/types";

export function createBlobDriver(token: string): StorageDriver {
  return {
    name: "blob",
    async put({ key, body, contentType }) {
      const result = await put(key, body, {
        access: "public",
        contentType,
        token,
        addRandomSuffix: false,
      });
      return { key, url: result.url, size: body.byteLength };
    },
    async remove(key) {
      await del(key, { token }).catch(() => undefined);
    },
    publicUrl(key) {
      return key;
    },
  };
}
