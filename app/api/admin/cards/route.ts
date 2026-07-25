import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/adminGuard";
import { logAudit } from "@/lib/audit";

// Carico di un nuovo lotto di card fisiche acquistate dall'admin.
// Accetta una lista di barcode già stampati (es. dal fornitore) oppure
// genera automaticamente N codici sequenziali se non forniti.
export async function POST(req: NextRequest) {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const { barcodes, quantity, batchLabel } = await req.json();

  let codes: string[] = [];
  if (Array.isArray(barcodes) && barcodes.length > 0) {
    codes = barcodes.map((b: string) => b.trim().toUpperCase());
  } else if (quantity && quantity > 0) {
    const prefix = "KO-" + Date.now().toString(36).toUpperCase() + "-";
    codes = Array.from({ length: quantity }, (_, i) => prefix + String(i + 1).padStart(4, "0"));
  } else {
    return NextResponse.json({ error: "Fornisci una lista di barcode o una quantità" }, { status: 400 });
  }

  const admin = createAdminClient();
  const rows = codes.map((barcode) => ({
    barcode,
    batch_label: batchLabel || null,
    created_by: adminUser.id,
  }));

  const { data: inserted, error: insErr } = await admin.from("cards").insert(rows).select("id, barcode");

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  await logAudit({
    actorType: "admin",
    actorId: adminUser.id,
    action: "cards_batch_created",
    entityType: "card",
    entityId: inserted?.[0]?.id ?? adminUser.id,
    detail: { count: codes.length, batchLabel },
  });

  return NextResponse.json({ ok: true, created: inserted });
}

// Elenco completo delle card con stato ed eventuale cliente collegato.
export async function GET() {
  const { admin: adminUser, error, status } = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error }, { status });

  const admin = createAdminClient();
  const { data } = await admin
    .from("cards")
    .select("id, barcode, status, batch_label, activated_at, clients(first_name, last_name)")
    .order("created_at", { ascending: false });

  return NextResponse.json({ cards: data ?? [] });
}
