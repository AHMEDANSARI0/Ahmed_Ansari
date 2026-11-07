import { redirect } from "next/navigation";
import { getCurrentSession, type SessionAdmin } from "@/lib/auth/session";

export async function requireSession(): Promise<SessionAdmin> {
  const session = await getCurrentSession();
  if (!session) redirect("/admin/login");
  return session;
}
