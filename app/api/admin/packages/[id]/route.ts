import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { logAudit } from "@/lib/audit";

// Modifica di un pacchetto già venduto: sport, numero ingressi totali/residui,
// prezzo, scadenza, stato. Riservato all'admin — la reception vende solo
// pacchetti nuovi, non può correggere quelli esistenti.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const body = await req.json();
  const { sportId, totalEntries, remainingEntries, price, expiryDate, packageStatus } = body;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("packages")
    .select("id, total_entries, remaining_entries")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Pacchetto non trovato" }, { status: 404 });

  const nextTotal = totalEntries ?? existing.total_entries;
  const nextRemaining = remainingEntries ?? existing.remaining_entries;

  if (nextRemaining > nextTotal) {
    return NextResponse.json({ error: "Gli ingressi residui non possono superare il totale" }, { status: 400 });
  }
  if (nextTotal < 1 || nextRemaining < 0) {
    return NextResponse.json({ error: "Valori non validi" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    total_entries: nextTotal,
    remaining_entries: nextRemaining,
  };
  if (sportId) update.sport_id = sportId;
  if (price !== undefined) update.price = price;
  if (expiryDate !== undefined) update.expiry_date = expiryDate || null;
  if (packageStatus) update.status = packageStatus;
  else if (nextRemaining === 0 && existing.remaining_entries !== 0) update.status = "exhausted";
  else if (nextRemaining > 0) update.status = "active";

  const { error: updErr } = await admin.from("packages").update(update).eq("id", params.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await logAudit({
    actorType: "admin",
    actorId: adminUser.id,
    action: "package_updated",
    entityType: "package",
    entityId: params.id,
    detail: { ...update },
  });

  return NextResponse.json({ ok: true });
}
