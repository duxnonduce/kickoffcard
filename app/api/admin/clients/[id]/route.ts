import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";

// Vista completa di un cliente: card possedute, TUTTI i pacchetti (attivi,
// esauriti, scaduti, cancellati) e lo storico completo degli ingressi.
// Accessibile solo all'admin: è la vista negata alla reception per privacy.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, first_name, last_name, codice_fiscale, email, phone, created_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });

  const { data: cards } = await admin
    .from("cards")
    .select("id, barcode, status, activated_at")
    .eq("client_id", client.id);

  const { data: packages } = await admin
    .from("packages")
    .select("id, card_id, sport_id, total_entries, remaining_entries, price, expiry_date, status, sold_at, sold_by_type, sold_by_id, sports(name)")
    .eq("client_id", client.id)
    .order("sold_at", { ascending: false });

  const { data: entryLogs } = await admin
    .from("entry_logs")
    .select("id, package_id, entries_deducted, performed_at, performed_by_type, performed_by_id, reversed, reversed_at, note")
    .eq("client_id", client.id)
    .order("performed_at", { ascending: false })
    .limit(100);

  // Risolvi i nomi di chi ha venduto/eseguito le azioni (admin o reception)
  const actorIds = new Set<string>();
  (packages ?? []).forEach((p) => actorIds.add(p.sold_by_id));
  (entryLogs ?? []).forEach((l) => actorIds.add(l.performed_by_id));

  const [{ data: admins }, { data: receptionists }] = await Promise.all([
    admin.from("admins").select("id, full_name"),
    admin.from("receptionists").select("id, full_name"),
  ]);
  const nameById = new Map<string, string>();
  (admins ?? []).forEach((a) => nameById.set(a.id, a.full_name));
  (receptionists ?? []).forEach((r) => nameById.set(r.id, r.full_name));

  const packagesWithNames = (packages ?? []).map((p) => ({
    ...p,
    sold_by_name: nameById.get(p.sold_by_id) ?? "Sconosciuto",
  }));
  const entryLogsWithNames = (entryLogs ?? []).map((l) => ({
    ...l,
    performed_by_name: nameById.get(l.performed_by_id) ?? "Sconosciuto",
  }));

  return NextResponse.json({
    client,
    cards: cards ?? [],
    packages: packagesWithNames,
    entryLogs: entryLogsWithNames,
  });
}
