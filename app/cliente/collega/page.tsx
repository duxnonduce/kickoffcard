"use client";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function ClienteCollegaPage() {
  const [cf, setCf] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/client/link-cf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codiceFiscale: cf }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(data.error || "Errore di collegamento");
    window.location.href = "/cliente";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="bg-ko-field/40 border border-ko-line/10 rounded-2xl p-7 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="font-display text-2xl mb-3 text-center">Un ultimo passo</h1>
        <p className="text-sm text-ko-line/60 mb-5">
          Inserisci il codice fiscale che hai lasciato in reception: troveremo subito le tue card e i tuoi pacchetti.
        </p>
        <input
          className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-4 font-mono tracking-wide"
          placeholder="Codice fiscale"
          value={cf}
          onChange={(e) => setCf(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {err && <div className="text-ko-alert text-sm mb-4">{err}</div>}
        <button onClick={submit} disabled={loading || cf.length < 11} className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg disabled:opacity-40">
          {loading ? "Ricerca..." : "Trova le mie card"}
        </button>
      </div>
    </main>
  );
}
