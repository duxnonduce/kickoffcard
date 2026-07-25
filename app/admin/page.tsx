"use client";
import { useEffect, useState } from "react";

type CardRow = {
  id: string;
  barcode: string;
  status: string;
  batch_label: string | null;
  clients: { first_name: string; last_name: string } | null;
};
type Receptionist = { id: string; full_name: string; active: boolean; created_at: string };

export default function AdminDashboard() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [tab, setTab] = useState<"cards" | "staff">("cards");

  const [qty, setQty] = useState(20);
  const [batchLabel, setBatchLabel] = useState("");
  const [newRecName, setNewRecName] = useState("");
  const [newRecPin, setNewRecPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAll() {
    const [c, r] = await Promise.all([
      fetch("/api/admin/cards").then((r) => r.json()),
      fetch("/api/admin/receptionists").then((r) => r.json()),
    ]);
    setCards(c.cards ?? []);
    setReceptionists(r.receptionists ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const available = cards.filter((c) => c.status === "disponibile").length;
  const linked = cards.filter((c) => c.status === "associata").length;

  async function createBatch() {
    const res = await fetch("/api/admin/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty, batchLabel }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg(`${qty} card create.`);
    setBatchLabel("");
    loadAll();
  }

  async function createReceptionist() {
    const res = await fetch("/api/admin/receptionists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: newRecName, pin: newRecPin }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setMsg(`Account reception creato per ${newRecName}.`);
    setNewRecName("");
    setNewRecPin("");
    loadAll();
  }

  return (
    <main className="min-h-screen px-8 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF · ADMIN</div>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Card disponibili" value={available} />
        <StatCard label="Card associate" value={linked} />
        <StatCard label="Reception attivi" value={receptionists.filter((r) => r.active).length} />
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("cards")} className={`px-4 py-2 rounded-lg font-display ${tab === "cards" ? "bg-ko-whistle text-ko-ink" : "border border-ko-line/20"}`}>Card</button>
        <button onClick={() => setTab("staff")} className={`px-4 py-2 rounded-lg font-display ${tab === "staff" ? "bg-ko-whistle text-ko-ink" : "border border-ko-line/20"}`}>Reception</button>
      </div>

      {msg && <div className="mb-4 text-sm bg-ko-field/40 border border-ko-line/10 rounded-lg p-3">{msg}</div>}

      {tab === "cards" && (
        <div>
          <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-5 mb-6 max-w-lg">
            <h2 className="font-display text-xl mb-3">Carica nuovo lotto card</h2>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs text-ko-line/50">Quantità</label>
                <input type="number" min={1} className="w-24 bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 1)} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-ko-line/50">Etichetta lotto (opzionale)</label>
                <input className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} placeholder="es. Lotto luglio 2026" />
              </div>
              <button onClick={createBatch} className="bg-ko-whistle text-ko-ink font-display px-5 py-2.5 rounded-lg">Crea</button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="text-ko-line/50 text-left">
              <tr><th className="pb-2">Barcode</th><th>Stato</th><th>Cliente</th><th>Lotto</th></tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-t border-ko-line/10">
                  <td className="py-2 font-mono">{c.barcode}</td>
                  <td>{c.status === "disponibile" ? "Disponibile" : "Associata"}</td>
                  <td>{c.clients ? `${c.clients.first_name} ${c.clients.last_name}` : "—"}</td>
                  <td>{c.batch_label ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "staff" && (
        <div>
          <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-5 mb-6 max-w-lg">
            <h2 className="font-display text-xl mb-3">Nuovo account reception</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-ko-line/50">Nome</label>
                <input className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3" value={newRecName} onChange={(e) => setNewRecName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-ko-line/50">PIN (4-6 cifre)</label>
                <input className="w-28 bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-3 font-mono" value={newRecPin} onChange={(e) => setNewRecPin(e.target.value.replace(/\D/g, ""))} maxLength={6} />
              </div>
              <button onClick={createReceptionist} className="bg-ko-whistle text-ko-ink font-display px-5 py-2.5 rounded-lg">Crea</button>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="text-ko-line/50 text-left">
              <tr><th className="pb-2">Nome</th><th>Stato</th><th>Creato il</th></tr>
            </thead>
            <tbody>
              {receptionists.map((r) => (
                <tr key={r.id} className="border-t border-ko-line/10">
                  <td className="py-2">{r.full_name}</td>
                  <td>{r.active ? "Attivo" : "Disattivato"}</td>
                  <td>{new Date(r.created_at).toLocaleDateString("it-IT")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-5">
      <div className="text-ko-line/50 text-xs tracking-wide uppercase mb-1">{label}</div>
      <div className="font-display text-4xl">{value}</div>
    </div>
  );
}
