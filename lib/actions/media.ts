"use server";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { mediaAssets } from "@/lib/db/schema";
import { runAction } from "@/lib/actions/result";
import { requireActionContext } from "@/lib/security/guard";
import { PERMISSIONS } from "@/lib/permissions";
import { recordAudit } from "@/lib/audit";
import { bumpTags } from "@/lib/cache";
import { CONFIG_TAGS } from "@/lib/services/settings";
import { AppError } from "@/lib/errors";
import {
  MAX_UPLOAD_BYTES,
  extensionFor,
  isAllowedMime,
  matchesSignature,
  safeKey,
  storage,
} from "@/lib/storage";
import { sanitizeText } from "@/lib/security/sanitize";
import { mediaUpdateSchema } from "@/lib/validations/media";

const CSRF_FIELD = "csrf-token";

async function imageSize(buffer: Buffer) {
  // Small dependency-free probe: enough to store real dimensions for layout hints.
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.subarray(0, 2).toString("ascii") === "\xff\xd8") {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1]!;
      const length = buffer.readUInt16BE(offset + 2);
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  return { width: null, height: null };
}

export async function uploadMediaAction(formData: FormData) {
  return runAction("media.upload", async () => {
    const context = await requireActionContext(
      PERMISSIONS.mediaManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("Choose a file to upload.", "VALIDATION");

    if (file.size === 0) throw new AppError("The file is empty.", "VALIDATION");
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AppError("Files must be 8 MB or smaller.", "VALIDATION");
    }

    const mimeType = file.type;
    if (!isAllowedMime(mimeType)) {
      throw new AppError("Only JPEG, PNG, WebP, AVIF and PDF files are accepted.", "VALIDATION");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(buffer, mimeType)) {
      throw new AppError("The file content does not match its type.", "VALIDATION");
    }

    const checksum = createHash("sha256").update(buffer).digest("hex");
    const db = getDb();

    const [duplicate] = await db
      .select({ id: mediaAssets.id, url: mediaAssets.url })
      .from(mediaAssets)
      .where(eq(mediaAssets.checksum, checksum))
      .limit(1);

    if (duplicate) {
      return { id: duplicate.id, url: duplicate.url, duplicate: true };
    }

    const extension = extensionFor(mimeType)!;
    const key = safeKey(`${file.name.replace(/\.[^.]+$/, "")}.${extension}`);
    const driver = storage();
    const stored = await driver.put({ key, body: buffer, contentType: mimeType });
    const dimensions = await imageSize(buffer);

    const [created] = await db
      .insert(mediaAssets)
      .values({
        fileName: key,
        originalName: sanitizeText(file.name).slice(0, 255),
        url: stored.url,
        kind: mimeType === "application/pdf" ? "document" : "image",
        mimeType,
        sizeBytes: stored.size,
        width: dimensions.width,
        height: dimensions.height,
        alt: null,
        storageDriver: driver.name,
        checksum,
        uploadedBy: context.session.id,
      })
      .returning({ id: mediaAssets.id, url: mediaAssets.url });

    if (!created) throw new AppError("Upload could not be recorded.", "INTERNAL", 500);

    await recordAudit({
      adminId: context.session.id,
      action: "media.uploaded",
      entity: "media_assets",
      entityId: created.id,
      summary: `${file.name} (${Math.round(stored.size / 1024)} KB)`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id: created.id, url: created.url, duplicate: false };
  });
}

export async function updateMediaAction(formData: FormData) {
  return runAction("media.update", async () => {
    const context = await requireActionContext(
      PERMISSIONS.mediaManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );
    const payload = mediaUpdateSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));

    const db = getDb();
    await db
      .update(mediaAssets)
      .set({
        alt: payload.alt ? sanitizeText(payload.alt) : null,
        ...(payload.fileName ? { originalName: sanitizeText(payload.fileName) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, payload.id));

    await recordAudit({
      adminId: context.session.id,
      action: "media.updated",
      entity: "media_assets",
      entityId: payload.id,
      summary: "Media metadata updated",
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id: payload.id };
  });
}

export async function deleteMediaAction(formData: FormData) {
  return runAction("media.delete", async () => {
    const context = await requireActionContext(
      PERMISSIONS.mediaManage,
      String(formData.get(CSRF_FIELD) ?? ""),
    );

    const id = String(formData.get("id") ?? "");
    if (!id) throw new AppError("Missing media id.", "VALIDATION");

    const db = getDb();
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (!asset) throw new AppError("Asset not found.", "NOT_FOUND", 404);

    await storage().remove(asset.fileName);
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));

    await recordAudit({
      adminId: context.session.id,
      action: "media.deleted",
      entity: "media_assets",
      entityId: id,
      summary: `Deleted ${asset.originalName}`,
      ip: context.ip,
    });

    bumpTags(CONFIG_TAGS.content);
    return { id };
  });
}
