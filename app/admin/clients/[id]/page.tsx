"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminNav from "../../_components/AdminNav";

type Client = { id: string; first_name: string; last_name: string; codice_fiscale: string; email: string | null; phone: string | null };
type CardRow = { id: string; barcode: string; status: string; activated_at: string | null };
type Sport = { id: string; name: string };
type PackageRow = {
  id: string; card_id: string; sport_id: string; total_entries: number; remaining_entries: number;
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
  const [sports, setSports] = useState<Sport[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddPackage, setShowAddPackage] = useState(false);

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
    fetch("/api/sports").then((r) => r.json()).then((d) => setSports(d.sports ?? []));
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
      <AdminNav />

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

      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-2xl">Pacchetti — storico completo</h2>
        <button
          onClick={() => setShowAddPackage((v) => !v)}
          className="bg-ko-whistle text-ko-ink font-display tracking-wide text-sm px-4 py-2 rounded-lg"
        >
          + Nuovo pacchetto
        </button>
      </div>

      {showAddPackage && (
        <AddPackageForm
          cards={cards}
          sports={sports}
          onDone={(text) => { setMsg(text); setShowAddPackage(false); load(); }}
          onError={(text) => setMsg(text)}
        />
      )}

      <table className="w-full text-sm mb-8">
        <thead className="text-ko-line/50 text-left">
          <tr><th className="pb-2">Sport</th><th>Ingressi</th><th>Prezzo</th><th>Scadenza</th><th>Stato</th><th>Venduto da</th><th>Data</th><th></th></tr>
        </thead>
        <tbody>
          {packages.map((p) =>
            editingId === p.id ? (
              <EditPackageRow
                key={p.id}
                pkg={p}
                sports={sports}
                onCancel={() => setEditingId(null)}
                onSaved={(text) => { setMsg(text); setEditingId(null); load(); }}
                onError={(text) => setMsg(text)}
              />
            ) : (
              <tr key={p.id} className="border-t border-ko-line/10">
                <td className="py-2">{p.sports?.name ?? "—"}</td>
                <td>{p.remaining_entries} / {p.total_entries}</td>
                <td>€{Number(p.price).toFixed(2)}</td>
                <td>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString("it-IT") : "—"}</td>
                <td>{statusLabel[p.status] ?? p.status}</td>
                <td>{p.sold_by_name}</td>
                <td>{new Date(p.sold_at).toLocaleDateString("it-IT")}</td>
                <td className="text-right">
                  <button onClick={() => setEditingId(p.id)} className="text-ko-whistle hover:underline text-xs">Modifica</button>
                </td>
              </tr>
            )
          )}
          {packages.length === 0 && <tr><td colSpan={8} className="text-ko-line/50 py-4 text-center">Nessun pacchetto.</td></tr>}
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

function EditPackageRow({
  pkg, sports, onCancel, onSaved, onError,
}: {
  pkg: PackageRow; sports: Sport[]; onCancel: () => void;
  onSaved: (t: string) => void; onError: (t: string) => void;
}) {
  const [sportId, setSportId] = useState(pkg.sport_id);
  const [total, setTotal] = useState(pkg.total_entries);
  const [remaining, setRemaining] = useState(pkg.remaining_entries);
  const [price, setPrice] = useState(Number(pkg.price));
  const [expiry, setExpiry] = useState(pkg.expiry_date ? pkg.expiry_date.slice(0, 10) : "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sportId, totalEntries: total, remainingEntries: remaining, price, expiryDate: expiry || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return onError(data.error || "Errore nel salvataggio");
    onSaved("Pacchetto aggiornato.");
  }

  return (
    <tr className="border-t border-ko-line/10 bg-ko-field/20">
      <td className="py-2">
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-1.5 px-2" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </td>
      <td>
        <div className="flex items-center gap-1">
          <input type="number" min={0} className="w-14 bg-ko-ink border border-ko-line/20 rounded-lg py-1.5 px-2" value={remaining} onChange={(e) => setRemaining(parseInt(e.target.value) || 0)} />
          <span>/</span>
          <input type="number" min={1} className="w-14 bg-ko-ink border border-ko-line/20 rounded-lg py-1.5 px-2" value={total} onChange={(e) => setTotal(parseInt(e.target.value) || 1)} />
        </div>
      </td>
      <td>
        <input type="number" min={0} step="0.01" className="w-20 bg-ko-ink border border-ko-line/20 rounded-lg py-1.5 px-2" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
      </td>
      <td>
        <input type="date" className="bg-ko-ink border border-ko-line/20 rounded-lg py-1.5 px-2" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </td>
      <td colSpan={3}></td>
      <td className="text-right whitespace-nowrap">
        <button onClick={save} disabled={saving} className="text-ko-whistle hover:underline text-xs mr-3">{saving ? "Salvo..." : "Salva"}</button>
        <button onClick={onCancel} className="text-ko-line/50 hover:text-ko-line text-xs">Annulla</button>
      </td>
    </tr>
  );
}

function AddPackageForm({
  cards, sports, onDone, onError,
}: {
  cards: CardRow[]; sports: Sport[]; onDone: (t: string) => void; onError: (t: string) => void;
}) {
  const [cardId, setCardId] = useState(cards[0]?.id ?? "");
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [entries, setEntries] = useState(10);
  const [price, setPrice] = useState(0);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!cardId && cards[0]) setCardId(cards[0].id); }, [cards]);
  useEffect(() => { if (!sportId && sports[0]) setSportId(sports[0].id); }, [sports]);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, sportId, totalEntries: entries, price, expiryDate: expiry || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return onError(data.error || "Errore vendita pacchetto");
    onDone("Nuovo pacchetto assegnato.");
  }

  return (
    <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-5 mb-5">
      <div className="grid grid-cols-2 gap-3 max-w-xl">
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 col-span-2" value={cardId} onChange={(e) => setCardId(e.target.value)}>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.barcode}</option>)}
        </select>
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 col-span-2" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div>
          <label className="text-xs text-ko-line/50">Numero ingressi</label>
          <input type="number" min={1} className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" value={entries} onChange={(e) => setEntries(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className="text-xs text-ko-line/50">Prezzo (€)</label>
          <input type="number" min={0} step="0.01" className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-ko-line/50">Scadenza (opzionale)</label>
          <input type="date" className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>
      <button onClick={submit} disabled={loading || !cardId || !sportId} className="mt-4 bg-ko-whistle text-ko-ink font-display tracking-wide px-6 py-2.5 rounded-lg disabled:opacity-40">
        {loading ? "Salvataggio..." : "Assegna pacchetto"}
      </button>
    </div>
  );
}
