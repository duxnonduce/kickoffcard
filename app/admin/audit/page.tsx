"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type LogRow = {
  id: string;
  actor_type: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  detail: Record<string, unknown>;
  created_at: string;
};

const actionLabel: Record<string, string> = {
  card_linked: "Card associata a cliente",
  package_sold: "Pacchetto venduto",
  entry_deducted: "Ingresso scalato",
  entry_reversed: "Ingresso annullato",
  cards_batch_created: "Lotto card creato",
  receptionist_created: "Account reception creato",
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
      <header className="flex items-center justify-between mb-6">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF · ADMIN</div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-ko-line/60 hover:text-ko-line">Dashboard</Link>
          <Link href="/admin/clients" className="text-ko-line/60 hover:text-ko-line">Clienti</Link>
          <Link href="/admin/audit" className="text-ko-whistle">Audit log</Link>
        </nav>
      </header>

      <h1 className="font-display text-3xl mb-4">Registro attività</h1>

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

      <table className="w-full text-sm">
        <thead className="text-ko-line/50 text-left">
          <tr><th className="pb-2">Data</th><th>Azione</th><th>Operatore</th><th>Dettaglio</th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-t border-ko-line/10 align-top">
              <td className="py-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString("it-IT")}</td>
              <td>{actionLabel[l.action] ?? l.action}</td>
              <td>{l.actor_name} <span className="text-ko-line/40">({l.actor_type === "admin" ? "admin" : "reception"})</span></td>
              <td className="font-mono text-xs text-ko-line/60">{JSON.stringify(l.detail)}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={4} className="text-ko-line/50 py-6 text-center">Nessuna attività registrata.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
