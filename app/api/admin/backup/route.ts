import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { can, PERMISSIONS } from "@/lib/permissions";
import { buildContentBackup } from "@/lib/services/backup";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !can(session.role, PERMISSIONS.backupManage)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backup = await buildContentBackup();
  const fileName = `content-${backup.exportedAt.slice(0, 19).replace(/[:T]/g, "-")}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${fileName}"`,
      "cache-control": "no-store",
    },
  });
}
