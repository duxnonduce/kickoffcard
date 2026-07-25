import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";

// Ricerca clienti per nome, cognome, codice fiscale o telefono.
// Vista riservata all'admin: la reception non ha un elenco anagrafiche navigabile.
export async function GET(req: NextRequest) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const admin = createAdminClient();

  let query = admin
    .from("clients")
    .select("id, first_name, last_name, codice_fiscale, email, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,codice_fiscale.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  return NextResponse.json({ clients: data ?? [] });
}
