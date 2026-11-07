import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/services/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AI Automation Engineer";

export default async function OpengraphImage() {
  const settings = await getSiteSettings();

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
            Building intelligence. Automating the future.
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
      </div>
    ),
    size,
  );
}
