import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActor } from "@/lib/auth/actorGuard";

// Scan/inserimento manuale del barcode. Ritorna:
// - card disponibile -> pronta per essere associata a un cliente
// - card associata -> dati cliente correnti + pacchetti ATTIVI (mai lo storico chiuso,
//   coerente con la privacy verso la reception)
export async function GET(req: NextRequest) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const barcode = req.nextUrl.searchParams.get("barcode")?.trim();
  if (!barcode) return NextResponse.json({ error: "Barcode mancante" }, { status: 400 });

  const admin = createAdminClient();
  const { data: card } = await admin
    .from("cards")
    .select("id, barcode, status, client_id")
    .eq("barcode", barcode)
    .maybeSingle();

  if (!card) return NextResponse.json({ error: "Card non trovata" }, { status: 404 });

  if (card.status === "disponibile") {
    return NextResponse.json({ card, client: null, packages: [] });
  }

  const { data: client } = await admin
    .from("clients")
    .select("id, first_name, last_name, codice_fiscale, email, phone")
    .eq("id", card.client_id)
    .maybeSingle();

  const { data: packages } = await admin
    .from("packages")
    .select("id, sport_id, total_entries, remaining_entries, price, expiry_date, status, sports(name)")
    .eq("card_id", card.id)
    .eq("status", "active")
    .order("sold_at", { ascending: false });

  return NextResponse.json({ card, client, packages: packages ?? [] });
}
