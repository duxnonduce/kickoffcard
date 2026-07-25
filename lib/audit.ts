import { createAdminClient } from "@/lib/supabase/admin";

type ActorType = "admin" | "receptionist";

// Scrive una riga di audit per ogni azione rilevante (associazione card,
// vendita pacchetto, ingresso scalato, annullamento...). Va chiamata da
// ogni Route Handler che modifica dati sensibili, subito dopo la scrittura.
export async function logAudit(params: {
  actorType: ActorType;
  actorId: string;
  action: string;
  entityType: "card" | "package" | "entry_log" | "client";
  entityId: string;
  detail?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_type: params.actorType,
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    detail: params.detail ?? {},
  });
}
