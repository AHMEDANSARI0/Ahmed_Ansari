import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { can, PERMISSIONS } from "@/lib/permissions";
import { listMedia } from "@/lib/services/media";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !can(session.role, PERMISSIONS.mediaManage)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assets = await listMedia({ limit: 200 });
  return NextResponse.json(
    { assets },
    { headers: { "cache-control": "no-store" } },
  );
}
