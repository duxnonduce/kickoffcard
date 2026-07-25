import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActor } from "@/lib/auth/actorGuard";

// Elenco sport attivi, usato per popolare il selettore in fase di vendita pacchetto.
export async function GET() {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin.from("sports").select("id, name").eq("active", true).order("name");
  return NextResponse.json({ sports: data ?? [] });
}
