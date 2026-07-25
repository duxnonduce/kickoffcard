"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Client = { id: string; first_name: string; last_name: string; codice_fiscale: string; email: string | null; phone: string | null };
type CardRow = { id: string; barcode: string; status: string; activated_at: string | null };
type PackageRow = {
  id: string; card_id: string; total_entries: number; remaining_entries: number;
  price: number; expiry_date: string | null; status: string; sold_at: string;
  sold_by_name: string; sports: { name: string } | null;
};
type EntryLog = {
  id: string; package_id: string; entries_deducted: number; performed_at: string;
  performed_by_name: string; reversed: boolean; reversed_at: string | null; note: string | null;
};

const statusLabel: Record<string, string> = {
  active: "Attivo", exhausted: "Esaurito", expired: "Scaduto", cancelled: "Annullato",
};

export default function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/clients/${params.id}`);
    const data = await res.json();
    setClient(data.client);
    setCards(data.cards ?? []);
    setPackages(data.packages ?? []);
    setEntryLogs(data.entryLogs ?? []);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function reverseEntry(id: string) {
    if (!confirm("Annullare questo ingresso? Verrà ripristinato sul pacchetto.")) return;
    const res = await fetch(`/api/admin/entry-logs/${id}/reverse`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg("Ingresso annullato e ripristinato.");
    load();
  }

  if (!client) return <main className="px-8 py-6 text-ko-line/50">Caricamento...</main>;

  return (
    <main className="min-h-screen px-8 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF · ADMIN</div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-ko-line/60 hover:text-ko-line">Dashboard</Link>
          <Link href="/admin/clients" className="text-ko-line/60 hover:text-ko-line">Clienti</Link>
          <Link href="/admin/audit" className="text-ko-line/60 hover:text-ko-line">Audit log</Link>
        </nav>
      </header>

      <Link href="/admin/clients" className="text-sm text-ko-line/50 hover:text-ko-line">← Torna alla ricerca</Link>
      <h1 className="font-display text-4xl mt-2 mb-1">{client.first_name} {client.last_name}</h1>
      <div className="text-ko-line/60 font-mono text-sm mb-1">{client.codice_fiscale}</div>
      <div className="text-ko-line/60 text-sm mb-6">{client.phone ?? "—"} {client.email ? `· ${client.email}` : ""}</div>

      {msg && <div className="mb-4 text-sm bg-ko-field/40 border border-ko-line/10 rounded-lg p-3">{msg}</div>}

      <h2 className="font-display text-2xl mb-2">Card</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {cards.map((c) => (
          <div key={c.id} className="font-mono text-sm bg-ko-field/30 border border-ko-line/10 rounded-lg px-3 py-2">{c.barcode}</div>
        ))}
      </div>

      <h2 className="font-display text-2xl mb-2">Pacchetti — storico completo</h2>
      <table className="w-full text-sm mb-8">
        <thead className="text-ko-line/50 text-left">
          <tr><th className="pb-2">Sport</th><th>Ingressi</th><th>Prezzo</th><th>Scadenza</th><th>Stato</th><th>Venduto da</th><th>Data</th></tr>
        </thead>
        <tbody>
          {packages.map((p) => (
            <tr key={p.id} className="border-t border-ko-line/10">
              <td className="py-2">{p.sports?.name ?? "—"}</td>
              <td>{p.remaining_entries} / {p.total_entries}</td>
              <td>€{Number(p.price).toFixed(2)}</td>
              <td>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString("it-IT") : "—"}</td>
              <td>{statusLabel[p.status] ?? p.status}</td>
              <td>{p.sold_by_name}</td>
              <td>{new Date(p.sold_at).toLocaleDateString("it-IT")}</td>
            </tr>
          ))}
          {packages.length === 0 && <tr><td colSpan={7} className="text-ko-line/50 py-4 text-center">Nessun pacchetto.</td></tr>}
        </tbody>
      </table>

      <h2 className="font-display text-2xl mb-2">Ingressi — storico completo</h2>
      <table className="w-full text-sm">
        <thead className="text-ko-line/50 text-left">
          <tr><th className="pb-2">Data</th><th>Quantità</th><th>Operatore</th><th>Stato</th><th></th></tr>
        </thead>
        <tbody>
          {entryLogs.map((l) => (
            <tr key={l.id} className="border-t border-ko-line/10">
              <td className="py-2">{new Date(l.performed_at).toLocaleString("it-IT")}</td>
              <td>{l.entries_deducted}</td>
              <td>{l.performed_by_name}</td>
              <td>{l.reversed ? <span className="text-ko-alert">Annullato</span> : "Regolare"}</td>
              <td className="text-right">
                {!l.reversed && (
                  <button onClick={() => reverseEntry(l.id)} className="text-ko-alert hover:underline text-xs">
                    Annulla ingresso
                  </button>
                )}
              </td>
            </tr>
          ))}
          {entryLogs.length === 0 && <tr><td colSpan={5} className="text-ko-line/50 py-4 text-center">Nessun ingresso registrato.</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
