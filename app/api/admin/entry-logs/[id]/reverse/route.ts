import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { logAudit } from "@/lib/audit";

// Annulla un ingresso scalato per errore. Solo l'admin può farlo.
// Ripristina gli ingressi sul pacchetto e riattiva il pacchetto se era esaurito.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data: entryLog } = await admin
    .from("entry_logs")
    .select("id, package_id, entries_deducted, reversed")
    .eq("id", params.id)
    .maybeSingle();

  if (!entryLog) return NextResponse.json({ error: "Ingresso non trovato" }, { status: 404 });
  if (entryLog.reversed) return NextResponse.json({ error: "Ingresso già annullato" }, { status: 409 });

  const { data: pkg } = await admin
    .from("packages")
    .select("id, remaining_entries, total_entries")
    .eq("id", entryLog.package_id)
    .maybeSingle();

  if (!pkg) return NextResponse.json({ error: "Pacchetto non trovato" }, { status: 404 });

  const restored = Math.min(pkg.remaining_entries + entryLog.entries_deducted, pkg.total_entries);

  await admin
    .from("packages")
    .update({ remaining_entries: restored, status: "active" })
    .eq("id", pkg.id);

  await admin
    .from("entry_logs")
    .update({ reversed: true, reversed_by_id: adminUser.id, reversed_at: new Date().toISOString() })
    .eq("id", entryLog.id);

  await logAudit({
    actorType: "admin",
    actorId: adminUser.id,
    action: "entry_reversed",
    entityType: "entry_log",
    entityId: entryLog.id,
    detail: { packageId: pkg.id, restoredEntries: entryLog.entries_deducted },
  });

  return NextResponse.json({ ok: true, remaining: restored });
}
