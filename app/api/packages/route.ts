import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActor } from "@/lib/auth/actorGuard";
import { logAudit } from "@/lib/audit";
import { sendPurchaseEmail } from "@/lib/email";

// Vendita di un nuovo pacchetto su una card già associata a un cliente.
// Una card può avere più pacchetti attivi in parallelo, uno per sport.
export async function POST(req: NextRequest) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { barcode, cardId, sportId, totalEntries, price, expiryDate } = await req.json();

  if ((!barcode && !cardId) || !sportId || !totalEntries || price === undefined) {
    return NextResponse.json({ error: "Dati pacchetto incompleti" }, { status: 400 });
  }
  if (totalEntries < 1) {
    return NextResponse.json({ error: "Il numero di ingressi deve essere almeno 1" }, { status: 400 });
  }

  const admin = createAdminClient();
  const cardQuery = admin.from("cards").select("id, status, client_id");
  const { data: card } = cardId
    ? await cardQuery.eq("id", cardId).maybeSingle()
    : await cardQuery.eq("barcode", barcode).maybeSingle();

  if (!card) return NextResponse.json({ error: "Card non trovata" }, { status: 404 });
  if (card.status !== "associata" || !card.client_id) {
    return NextResponse.json({ error: "La card non è ancora associata a un cliente" }, { status: 409 });
  }

  const { data: pkg, error } = await admin
    .from("packages")
    .insert({
      card_id: card.id,
      client_id: card.client_id,
      sport_id: sportId,
      total_entries: totalEntries,
      remaining_entries: totalEntries,
      price,
      expiry_date: expiryDate || null,
      sold_by_type: actor.type,
      sold_by_id: actor.id,
    })
    .select("id")
    .single();

  if (error || !pkg) return NextResponse.json({ error: error?.message }, { status: 500 });

  await logAudit({
    actorType: actor.type,
    actorId: actor.id,
    action: "package_sold",
    entityType: "package",
    entityId: pkg.id,
    detail: { barcode: barcode ?? null, cardId: cardId ?? card.id, sportId, totalEntries, price, expiryDate },
  });

  // Notifica email di acquisto (solo se il cliente ha un'email valida)
  const { data: clientRow } = await admin
    .from("clients")
    .select("email, first_name")
    .eq("id", card.client_id)
    .maybeSingle();
  const { data: sportRow } = await admin.from("sports").select("name").eq("id", sportId).maybeSingle();

  if (clientRow?.email && sportRow?.name) {
    await sendPurchaseEmail({
      to: clientRow.email,
      firstName: clientRow.first_name,
      sportName: sportRow.name,
      totalEntries,
      price,
      expiryDate: expiryDate || null,
    });
    await admin.from("notifications").insert({
      client_id: card.client_id,
      package_id: pkg.id,
      type: "acquisto",
    });
  } else {
    console.warn("[email] Nessuna email per il cliente " + card.client_id + ": notifica acquisto saltata");
  }

  return NextResponse.json({ ok: true, packageId: pkg.id });
}
