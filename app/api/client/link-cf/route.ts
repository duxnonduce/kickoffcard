import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Collega l'utente Supabase Auth appena loggato al record `clients` creato
// in precedenza da reception/admin, individuato tramite codice fiscale.
// Bypassa le RLS (service role) perché il record del cliente non ha ancora
// auth_user_id valorizzato, quindi la policy "auth_user_id = auth.uid()"
// non potrebbe mai far match da sola.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { codiceFiscale } = await req.json();
  if (!codiceFiscale) return NextResponse.json({ error: "Codice fiscale mancante" }, { status: 400 });

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("id, auth_user_id, first_name, last_name")
    .eq("codice_fiscale", codiceFiscale.trim().toUpperCase())
    .maybeSingle();

  if (!client) {
    return NextResponse.json(
      { error: "Nessuna card risulta associata a questo codice fiscale. Rivolgiti alla reception." },
      { status: 404 }
    );
  }

  if (client.auth_user_id && client.auth_user_id !== user.id) {
    return NextResponse.json(
      { error: "Questo codice fiscale è già collegato a un altro account." },
      { status: 409 }
    );
  }

  if (!client.auth_user_id) {
    const { error: updErr } = await admin
      .from("clients")
      .update({ auth_user_id: user.id, email: user.email })
      .eq("id", client.id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, firstName: client.first_name, lastName: client.last_name });
}
