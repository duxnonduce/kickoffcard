import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { createReceptionSession } from "@/lib/auth/receptionSession";

// Login reception: non c'è username, solo un PIN numerico condiviso solo
// con l'admin che ha creato l'account. Confrontiamo il PIN con l'hash di
// ogni receptionist attivo finché non troviamo un match.
export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN mancante" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: receptionists } = await admin
    .from("receptionists")
    .select("id, full_name, pin_hash")
    .eq("active", true);

  const match = (receptionists ?? []).find((r) => bcrypt.compareSync(pin, r.pin_hash));

  if (!match) {
    return NextResponse.json({ error: "PIN non valido" }, { status: 401 });
  }

  await createReceptionSession({ receptionistId: match.id, fullName: match.full_name });
  return NextResponse.json({ fullName: match.full_name });
}
