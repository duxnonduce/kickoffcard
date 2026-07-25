import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";

// Elenco cronologico di tutte le azioni sensibili (chi ha associato una card,
// chi ha venduto un pacchetto, chi ha scalato/annullato un ingresso...).
// Filtri opzionali: tipo entità, tipo attore.
export async function GET(req: NextRequest) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const entityType = req.nextUrl.searchParams.get("entityType");
  const actorType = req.nextUrl.searchParams.get("actorType");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);

  const admin = createAdminClient();
  let query = admin
    .from("audit_log")
    .select("id, actor_type, actor_id, action, entity_type, entity_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 300));

  if (entityType) query = query.eq("entity_type", entityType);
  if (actorType) query = query.eq("actor_type", actorType);

  const { data: logs, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const actorIds = new Set<string>((logs ?? []).map((l) => l.actor_id));
  const [{ data: admins }, { data: receptionists }] = await Promise.all([
    admin.from("admins").select("id, full_name"),
    admin.from("receptionists").select("id, full_name"),
  ]);
  const nameById = new Map<string, string>();
  (admins ?? []).forEach((a) => nameById.set(a.id, a.full_name));
  (receptionists ?? []).forEach((r) => nameById.set(r.id, r.full_name));

  const withNames = (logs ?? []).map((l) => ({
    ...l,
    actor_name: nameById.get(l.actor_id) ?? "Sconosciuto",
  }));

  return NextResponse.json({ logs: withNames });
}
