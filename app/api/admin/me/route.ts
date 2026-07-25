import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/adminGuard";

export async function GET() {
  const { admin, error, status } = await requireAdmin();
  if (!admin) return NextResponse.json({ error }, { status });
  return NextResponse.json({ admin });
}
