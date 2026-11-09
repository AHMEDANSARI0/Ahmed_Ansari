import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteSettings } from "@/lib/services/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Ahmed Ansari — AI automation engineer";
export const runtime = "nodejs";

const PORTRAIT_PATH = join(process.cwd(), "public", "images", "portrait-placeholder.jpg");

export default async function OpengraphImage() {
  const settings = await getSiteSettings();

  // A missing asset must not break the card: the gradient stands in silently.
  const portrait = await readFile(PORTRAIT_PATH)
    .then((file) => `data:image/jpeg;base64,${file.toString("base64")}`)
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050505",
          padding: 64,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 12, height: 12, backgroundColor: "#FF9418", marginRight: 16 }} />
          <div style={{ color: "#F5F5F5", fontSize: 22, letterSpacing: 8, fontWeight: 700 }}>
            {settings.logoText.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#FF9418", fontSize: 20, letterSpacing: 6 }}>
            {settings.role.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              color: "#F5F5F5",
              fontSize: 82,
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: -2,
              maxWidth: 900,
            }}
          >
            {settings.role}.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            borderTop: "1px solid #262626",
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", color: "#A3A3A3", fontSize: 18, letterSpacing: 4 }}>
            {settings.domain.replace(/^https?:\/\//, "")}
          </div>
          <div style={{ display: "flex", color: "#A3A3A3", fontSize: 18, letterSpacing: 4 }}>
            {settings.location}
          </div>
        </div>
        {portrait ? (
          <img
            src={portrait}
            alt=""
            width={330}
            height={412}
            style={{
              position: "absolute",
              right: 64,
              top: 64,
              objectFit: "cover",
              objectPosition: "top",
              opacity: 0.9,
              border: "1px solid #262626",
            }}
          />
        ) : null}
      </div>
    ),
    size,
  );
}
