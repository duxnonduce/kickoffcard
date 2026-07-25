import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActor } from "@/lib/auth/actorGuard";
import { logAudit } from "@/lib/audit";

// Scala N ingressi da UN pacchetto specifico (scelto dalla reception dopo
// lo scan). N di default è 1, ma può essere maggiore (es. "paga uno per tutti").
export async function POST(req: NextRequest) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { packageId, entries, note } = await req.json();
  const toDeduct = Number(entries) || 1;

  if (!packageId || toDeduct < 1) {
    return NextResponse.json({ error: "Dati check-in non validi" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pkg } = await admin
    .from("packages")
    .select("id, card_id, client_id, remaining_entries, status")
    .eq("id", packageId)
    .maybeSingle();

  if (!pkg) return NextResponse.json({ error: "Pacchetto non trovato" }, { status: 404 });
  if (pkg.status !== "active") {
    return NextResponse.json({ error: "Pacchetto non attivo" }, { status: 409 });
  }
  if (pkg.remaining_entries < toDeduct) {
    return NextResponse.json(
      { error: `Ingressi insufficienti: ne restano ${pkg.remaining_entries}, richiesti ${toDeduct}` },
      { status: 409 }
    );
  }

  const newRemaining = pkg.remaining_entries - toDeduct;

  const { error: updErr } = await admin
    .from("packages")
    .update({
      remaining_entries: newRemaining,
      status: newRemaining === 0 ? "exhausted" : "active",
    })
    .eq("id", pkg.id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  const { data: entryLog, error: logErr } = await admin
    .from("entry_logs")
    .insert({
      package_id: pkg.id,
      card_id: pkg.card_id,
      client_id: pkg.client_id,
      entries_deducted: toDeduct,
      performed_by_type: actor.type,
      performed_by_id: actor.id,
      note: note || null,
    })
    .select("id")
    .single();

  if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

  await logAudit({
    actorType: actor.type,
    actorId: actor.id,
    action: "entry_deducted",
    entityType: "entry_log",
    entityId: entryLog.id,
    detail: { packageId: pkg.id, entriesDeducted: toDeduct, remainingAfter: newRemaining },
  });

  return NextResponse.json({ ok: true, remaining: newRemaining });
}
