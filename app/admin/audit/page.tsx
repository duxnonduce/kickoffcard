"use client";
import { useEffect, useState } from "react";
import AdminNav from "../_components/AdminNav";

type LogRow = {
  id: string;
  actor_type: "admin" | "receptionist";
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: Record<string, any>;
  created_at: string;
};

function summarize(l: LogRow): string {
  const d = l.detail || {};
  switch (l.action) {
    case "card_linked":
      return `Card ${d.barcode ?? "—"} associata a ${d.clientName ?? "cliente"}`;
    case "package_sold":
      return `Pacchetto ${d.sportName ?? ""} venduto: ${d.totalEntries} ingressi a €${Number(d.price ?? 0).toFixed(2)}${d.expiryDate ? `, scadenza ${new Date(d.expiryDate).toLocaleDateString("it-IT")}` : ""}`;
    case "package_updated":
      return `Pacchetto ${d.sportName ?? ""} modificato${d.barcode ? ` (card ${d.barcode})` : ""}`;
    case "entry_deducted":
      return `${d.entriesDeducted} ingresso/i scalato/i su ${d.sportName ?? "pacchetto"} — ${d.remainingAfter} rimasti`;
    case "entry_reversed":
      return `Ingresso ripristinato su ${d.sportName ?? "pacchetto"} (+${d.restoredEntries})`;
    case "cards_batch_created":
      return `${d.count} card create${d.batchLabel ? ` — lotto: ${d.batchLabel}` : ""}`;
    case "receptionist_created":
      return `Account reception creato: ${d.fullName}`;
    default:
      return l.action;
  }
}

const entityLabel: Record<string, string> = {
  card: "Card", package: "Pacchetto", entry_log: "Ingresso", client: "Cliente",
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [entityType, setEntityType] = useState("");
  const [actorType, setActorType] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    if (actorType) params.set("actorType", actorType);
    const res = await fetch(`/api/admin/audit?${params.toString()}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
  }

  useEffect(() => {
    load();
  }, [entityType, actorType]);

  return (
    <main className="min-h-screen px-8 py-6">
      <AdminNav />

      <h1 className="font-display text-3xl mb-1">Registro attività</h1>
      <p className="text-ko-line/50 text-sm mb-6">Ogni azione rilevante, con chi l'ha eseguita e quando.</p>

      <div className="flex gap-3 mb-6">
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
          <option value="">Tutte le entità</option>
          <option value="card">Card</option>
          <option value="package">Pacchetti</option>
          <option value="entry_log">Ingressi</option>
          <option value="client">Clienti</option>
        </select>
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3" value={actorType} onChange={(e) => setActorType(e.target.value)}>
          <option value="">Tutti gli operatori</option>
          <option value="admin">Solo admin</option>
          <option value="receptionist">Solo reception</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-4 bg-ko-field/20 border border-ko-line/10 rounded-xl px-4 py-3">
            <div className="text-xs text-ko-line/40 font-mono whitespace-nowrap pt-0.5 w-36 shrink-0">
              {new Date(l.created_at).toLocaleDateString("it-IT")}
              <br />
              {new Date(l.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="flex-1">
              <div className="text-sm">{summarize(l)}</div>
              <div className="text-xs text-ko-line/40 mt-1">{entityLabel[l.entity_type] ?? l.entity_type}</div>
            </div>
            <div
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                l.actor_type === "admin" ? "bg-ko-whistle/20 text-ko-whistle" : "bg-ko-fieldLight/30 text-ko-line/80"
              }`}
            >
              {l.actor_name}
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="text-ko-line/50 py-10 text-center">Nessuna attività registrata.</div>}
      </div>
    </main>
  );
}
