import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActor } from "@/lib/auth/actorGuard";
import { logAudit } from "@/lib/audit";

// Associa una card "disponibile" a un cliente, creando l'anagrafica se il
// codice fiscale non esiste ancora, oppure riusando il cliente esistente
// (es. un cliente che compra una seconda card).
export async function POST(req: NextRequest) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const body = await req.json();
  const { barcode, firstName, lastName, codiceFiscale, email, phone } = body;

  if (!barcode || !firstName || !lastName || !codiceFiscale) {
    return NextResponse.json({ error: "Dati anagrafici incompleti" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: card } = await admin
    .from("cards")
    .select("id, status")
    .eq("barcode", barcode)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "Card non trovata" }, { status: 404 });
  if (card.status !== "disponibile") {
    return NextResponse.json({ error: "Card già associata a un cliente" }, { status: 409 });
  }

  // Cliente esistente (stesso CF) o nuovo
  let clientId: string;
  const { data: existingClient } = await admin
    .from("clients")
    .select("id")
    .eq("codice_fiscale", codiceFiscale.toUpperCase())
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientErr } = await admin
      .from("clients")
      .insert({
        first_name: firstName,
        last_name: lastName,
        codice_fiscale: codiceFiscale.toUpperCase(),
        email: email || null,
        phone: phone || null,
        created_by_type: actor.type,
        created_by_id: actor.id,
      })
      .select("id")
      .single();

    if (clientErr || !newClient) {
      return NextResponse.json({ error: "Errore creazione cliente: " + clientErr?.message }, { status: 500 });
    }
    clientId = newClient.id;
  }

  const { error: cardErr } = await admin
    .from("cards")
    .update({
      status: "associata",
      client_id: clientId,
      activated_at: new Date().toISOString(),
      activated_by_type: actor.type,
      activated_by_id: actor.id,
    })
    .eq("id", card.id);

  if (cardErr) return NextResponse.json({ error: cardErr.message }, { status: 500 });

  await logAudit({
    actorType: actor.type,
    actorId: actor.id,
    action: "card_linked",
    entityType: "card",
    entityId: card.id,
    detail: { clientId, barcode },
  });

  return NextResponse.json({ ok: true, clientId });
}
