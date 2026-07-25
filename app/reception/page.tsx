"use client";
import { useEffect, useRef, useState } from "react";

type Sport = { id: string; name: string };
type PackageRow = {
  id: string;
  sport_id: string;
  total_entries: number;
  remaining_entries: number;
  price: number;
  expiry_date: string | null;
  status: string;
  sports: { name: string } | null;
};
type Client = {
  id: string;
  first_name: string;
  last_name: string;
  codice_fiscale: string;
  email: string | null;
  phone: string | null;
};
type Card = { id: string; barcode: string; status: "disponibile" | "associata"; client_id: string | null };

export default function ReceptionDashboard() {
  const [barcode, setBarcode] = useState("");
  const [card, setCard] = useState<Card | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [mode, setMode] = useState<"idle" | "link" | "sell" | "checkin">("idle");
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/sports")
      .then((r) => r.json())
      .then((d) => setSports(d.sports ?? []));
    scanRef.current?.focus();
  }, []);

  function reset() {
    setCard(null);
    setClient(null);
    setPackages([]);
    setMode("idle");
    setBarcode("");
    scanRef.current?.focus();
  }

  async function doScan() {
    if (!barcode.trim()) return;
    setMsg(null);
    const res = await fetch(`/api/cards/lookup?barcode=${encodeURIComponent(barcode.trim())}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg({ type: "err", text: data.error || "Card non trovata" });
      setCard(null);
      setClient(null);
      setPackages([]);
      return;
    }
    setCard(data.card);
    setClient(data.client);
    setPackages(data.packages ?? []);
    setMode(data.card.status === "disponibile" ? "link" : "idle");
  }

  async function logout() {
    await fetch("/api/auth/reception-logout", { method: "POST" });
    window.location.href = "/reception/login";
  }

  return (
    <main className="min-h-screen px-8 py-6">
      <header className="flex items-center justify-between mb-8">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF · RECEPTION</div>
        <button onClick={logout} className="text-sm text-ko-line/60 hover:text-ko-line">
          Esci
        </button>
      </header>

      <div className="grid grid-cols-[380px_1fr] gap-6">
        {/* Colonna scan */}
        <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-6 h-fit">
          <h2 className="font-display text-2xl mb-4">Scansiona card</h2>
          <input
            ref={scanRef}
            className="barcode-input w-full font-mono text-lg bg-ko-ink border border-ko-line/20 rounded-lg py-3 px-4 mb-3"
            placeholder="KO-XXXXXXXX"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && doScan()}
          />
          <button onClick={doScan} className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg mb-2">
            Cerca
          </button>
          {(card || msg) && (
            <button onClick={reset} className="w-full text-sm text-ko-line/60 hover:text-ko-line py-2">
              Nuova scansione
            </button>
          )}
          {msg && (
            <div className={`mt-3 text-sm rounded-lg p-3 ${msg.type === "ok" ? "bg-green-900/40 text-green-300" : "bg-ko-alert/20 text-ko-alert"}`}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Colonna dettaglio / azioni */}
        <div className="bg-ko-field/30 border border-ko-line/10 rounded-2xl p-6 min-h-[400px]">
          {!card && <div className="text-ko-line/50 flex items-center justify-center h-full">Scansiona una card per iniziare.</div>}

          {card && card.status === "disponibile" && (
            <LinkClientForm
              barcode={card.barcode}
              onDone={(text) => {
                setMsg({ type: "ok", text });
                reset();
              }}
              onError={(text) => setMsg({ type: "err", text })}
            />
          )}

          {card && card.status === "associata" && client && (
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-ko-whistle text-xs tracking-widest font-display mb-1">CLIENTE</div>
                  <h2 className="font-display text-3xl">{client.first_name} {client.last_name}</h2>
                  <div className="text-ko-line/60 text-sm font-mono mt-1">{client.codice_fiscale}</div>
                  <div className="text-ko-line/60 text-sm mt-1">{client.phone} {client.email ? `· ${client.email}` : ""}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMode("sell")} className={`px-4 py-2 rounded-lg font-display tracking-wide text-sm ${mode === "sell" ? "bg-ko-whistle text-ko-ink" : "border border-ko-line/30"}`}>
                    Vendi pacchetto
                  </button>
                </div>
              </div>

              <h3 className="font-display text-xl mb-3">Pacchetti attivi</h3>
              {packages.length === 0 && <div className="text-ko-line/50 text-sm mb-4">Nessun pacchetto attivo su questa card.</div>}
              <div className="grid gap-3 mb-6">
                {packages.map((p) => (
                  <PackageCheckin
                    key={p.id}
                    pkg={p}
                    onDone={(text) => {
                      setMsg({ type: "ok", text });
                      doScan();
                    }}
                    onError={(text) => setMsg({ type: "err", text })}
                  />
                ))}
              </div>

              {mode === "sell" && (
                <SellPackageForm
                  barcode={card.barcode}
                  sports={sports}
                  onDone={(text) => {
                    setMsg({ type: "ok", text });
                    setMode("idle");
                    doScan();
                  }}
                  onError={(text) => setMsg({ type: "err", text })}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function LinkClientForm({ barcode, onDone, onError }: { barcode: string; onDone: (t: string) => void; onError: (t: string) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cf, setCf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/cards/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, firstName, lastName, codiceFiscale: cf, email, phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return onError(data.error || "Errore associazione card");
    onDone(`Card ${barcode} associata a ${firstName} ${lastName}.`);
  }

  return (
    <div>
      <div className="text-ko-whistle text-xs tracking-widest font-display mb-1">CARD DISPONIBILE</div>
      <h2 className="font-display text-2xl mb-4">Associa a un cliente — {barcode}</h2>
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        <input className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" placeholder="Cognome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <input className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 font-mono col-span-2" placeholder="Codice fiscale" value={cf} onChange={(e) => setCf(e.target.value.toUpperCase())} />
        <input className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3" placeholder="Telefono" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <button
        onClick={submit}
        disabled={loading || !firstName || !lastName || !cf}
        className="mt-4 bg-ko-whistle text-ko-ink font-display tracking-wide px-6 py-2.5 rounded-lg disabled:opacity-40"
      >
        {loading ? "Associazione..." : "Associa card"}
      </button>
    </div>
  );
}

function SellPackageForm({ barcode, sports, onDone, onError }: { barcode: string; sports: Sport[]; onDone: (t: string) => void; onError: (t: string) => void }) {
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [entries, setEntries] = useState(10);
  const [price, setPrice] = useState(0);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sportId && sports[0]) setSportId(sports[0].id);
  }, [sports]);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode, sportId, totalEntries: entries, price, expiryDate: expiry || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return onError(data.error || "Errore vendita pacchetto");
    onDone("Pacchetto assegnato con successo.");
  }

  return (
    <div className="border-t border-ko-line/10 pt-5 mt-2">
      <h3 className="font-display text-xl mb-3">Nuovo pacchetto</h3>
      <div className="grid grid-cols-2 gap-3 max-w-lg">
        <select className="bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 col-span-2" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
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
      <button onClick={submit} disabled={loading || !sportId} className="mt-4 bg-ko-whistle text-ko-ink font-display tracking-wide px-6 py-2.5 rounded-lg disabled:opacity-40">
        {loading ? "Salvataggio..." : "Conferma vendita"}
      </button>
    </div>
  );
}

function PackageCheckin({ pkg, onDone, onError }: { pkg: PackageRow; onDone: (t: string) => void; onError: (t: string) => void }) {
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(false);

  async function checkin() {
    setLoading(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: pkg.id, entries: amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return onError(data.error || "Errore check-in");
    onDone(`Ingresso registrato — ${pkg.sports?.name}: ${data.remaining} rimasti.`);
  }

  return (
    <div className="flex items-center justify-between bg-ko-ink/60 border border-ko-line/10 rounded-xl px-4 py-3">
      <div>
        <div className="font-display text-lg">{pkg.sports?.name ?? "Sport"}</div>
        <div className="text-sm text-ko-line/60">
          {pkg.remaining_entries} / {pkg.total_entries} ingressi
          {pkg.expiry_date ? ` · scade ${new Date(pkg.expiry_date).toLocaleDateString("it-IT")}` : ""}
          {" · "}€{Number(pkg.price).toFixed(2)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={pkg.remaining_entries}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-16 bg-ko-ink border border-ko-line/20 rounded-lg py-2 px-2 text-center"
        />
        <button onClick={checkin} disabled={loading} className="bg-ko-fieldLight hover:bg-ko-field transition px-4 py-2 rounded-lg font-display tracking-wide disabled:opacity-40">
          {loading ? "..." : "Scala ingresso"}
        </button>
      </div>
    </div>
  );
}
