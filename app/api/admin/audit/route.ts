import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";

// Elenco cronologico di tutte le azioni sensibili, con i dettagli arricchiti
// (nomi al posto degli ID grezzi) così la vista risulta leggibile senza dover
// interpretare JSON.
export async function GET(req: NextRequest) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const entityType = req.nextUrl.searchParams.get("entityType");
  const actorType = req.nextUrl.searchParams.get("actorType");
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 100);

  const admin = createAdminClient();
  let query = admin
    .from("audit_log")
    .select("id, actor_type, actor_id, action, entity_type, entity_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 300));

  if (entityType) query = query.eq("entity_type", entityType);
  if (actorType) query = query.eq("actor_type", actorType);

  const { data: logs, error: qErr } = await query;
  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });

  const rows = logs ?? [];

  // Nomi degli operatori (admin o reception)
  const actorIds = new Set<string>(rows.map((l) => l.actor_id));
  const [{ data: admins }, { data: receptionists }, { data: sports }] = await Promise.all([
    admin.from("admins").select("id, full_name"),
    admin.from("receptionists").select("id, full_name"),
    admin.from("sports").select("id, name"),
  ]);
  const nameById = new Map<string, string>();
  (admins ?? []).forEach((a) => nameById.set(a.id, a.full_name));
  (receptionists ?? []).forEach((r) => nameById.set(r.id, r.full_name));
  const sportById = new Map<string, string>((sports ?? []).map((s) => [s.id, s.name]));

  // Risolvi nomi cliente per i "card_linked"
  const clientIds = new Set<string>();
  rows.forEach((l) => {
    const d = l.detail as Record<string, unknown>;
    if (l.action === "card_linked" && d?.clientId) clientIds.add(String(d.clientId));
  });
  const clientNameById = new Map<string, string>();
  if (clientIds.size > 0) {
    const { data: clients } = await admin.from("clients").select("id, first_name, last_name").in("id", Array.from(clientIds));
    (clients ?? []).forEach((c) => clientNameById.set(c.id, `${c.first_name} ${c.last_name}`));
  }

  // Risolvi sport per i "entry_deducted" / "entry_reversed" / "package_updated" tramite packageId
  const packageIds = new Set<string>();
  rows.forEach((l) => {
    const d = l.detail as Record<string, unknown>;
    if (d?.packageId) packageIds.add(String(d.packageId));
  });
  const packageInfoById = new Map<string, { sportName: string; barcode: string }>();
  if (packageIds.size > 0) {
    const { data: pkgs } = await admin
      .from("packages")
      .select("id, sport_id, card_id")
      .in("id", Array.from(packageIds));
    const cardIds = (pkgs ?? []).map((p) => p.card_id);
    const { data: cardsData } = cardIds.length
      ? await admin.from("cards").select("id, barcode").in("id", cardIds)
      : { data: [] as { id: string; barcode: string }[] };
    const barcodeByCardId = new Map<string, string>((cardsData ?? []).map((c) => [c.id, c.barcode]));
    (pkgs ?? []).forEach((p) => {
      packageInfoById.set(p.id, {
        sportName: sportById.get(p.sport_id) ?? "sport sconosciuto",
        barcode: barcodeByCardId.get(p.card_id) ?? "",
      });
    });
  }

  const enriched = rows.map((l) => {
    const d = { ...(l.detail as Record<string, unknown>) };
    if (l.action === "card_linked" && d.clientId) d.clientName = clientNameById.get(String(d.clientId)) ?? null;
    if (l.action === "package_sold" && d.sportId) d.sportName = sportById.get(String(d.sportId)) ?? null;
    if ((l.action === "entry_deducted" || l.action === "entry_reversed" || l.action === "package_updated") && d.packageId) {
      const info = packageInfoById.get(String(d.packageId));
      if (info) {
        d.sportName = info.sportName;
        d.barcode = info.barcode;
      }
    }
    return {
      ...l,
      detail: d,
      actor_name: nameById.get(l.actor_id) ?? "Sconosciuto",
    };
  });

  return NextResponse.json({ logs: enriched });
}
