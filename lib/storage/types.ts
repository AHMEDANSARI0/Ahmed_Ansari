export type StoredObject = {
  key: string;
  url: string;
  size: number;
};

export type StorageDriver = {
  name: "local" | "blob";
  put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject>;
  remove(key: string): Promise<void>;
  publicUrl(key: string): string;
};

const ALLOWED_MIME = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["application/pdf", "pdf"],
]);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function extensionFor(mimeType: string) {
  return ALLOWED_MIME.get(mimeType) ?? null;
}

export function isAllowedMime(mimeType: string) {
  return ALLOWED_MIME.has(mimeType);
}

/**
 * Sniffs magic bytes so a renamed executable cannot slip through as an image.
 */
export function matchesSignature(buffer: Buffer, mimeType: string) {
  const head = buffer.subarray(0, 12);

  switch (mimeType) {
    case "image/jpeg":
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case "image/png":
      return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/webp":
      return head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP";
    case "image/avif":
      return head.subarray(4, 8).toString("ascii") === "ftyp";
    case "application/pdf":
      return head.subarray(0, 5).toString("ascii") === "%PDF-";
    default:
      return false;
  }
}

export function safeKey(fileName: string) {
  const base = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-80);

  // Millisecond stamps collide during bulk uploads, so a random suffix is
  // included to keep object keys unique.
  const stamp = Date.now().toString(36);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${suffix}-${base || "asset"}`;
}
