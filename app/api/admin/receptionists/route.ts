import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { logAudit } from "@/lib/audit";

// Crea un nuovo account reception con PIN numerico. Il PIN va comunicato
// a voce/di persona dall'admin: non è recuperabile via email.
export async function POST(req: NextRequest) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const { fullName, pin } = await req.json();
  if (!fullName || !pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Nome e PIN (4-6 cifre) obbligatori" }, { status: 400 });
  }

  const admin = createAdminClient();
  const pinHash = bcrypt.hashSync(pin, 10);

  const { data: rec, error: insErr } = await admin
    .from("receptionists")
    .insert({ full_name: fullName, pin_hash: pinHash, created_by: adminUser.id })
    .select("id, full_name")
    .single();

  if (insErr || !rec) return NextResponse.json({ error: insErr?.message }, { status: 500 });

  await logAudit({
    actorType: "admin",
    actorId: adminUser.id,
    action: "receptionist_created",
    entityType: "client", // riuso generico, l'entità reception non ha una categoria audit dedicata
    entityId: rec.id,
    detail: { fullName },
  });

  return NextResponse.json({ ok: true, receptionist: rec });
}

export async function GET() {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data } = await admin
    .from("receptionists")
    .select("id, full_name, active, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ receptionists: data ?? [] });
}
