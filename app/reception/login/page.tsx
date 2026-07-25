"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReceptionLoginPage() {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/reception-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setErr(data.error || "Errore di accesso");
      return;
    }
    router.push("/reception");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-ko-field/40 border border-ko-line/10 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-ko-whistle text-xs tracking-widest font-display mb-2">KICK OFF · RECEPTION</div>
        <h1 className="font-display text-3xl mb-6">Inserisci il PIN</h1>
        <input
          className="w-full text-center text-2xl font-mono tracking-widest bg-ko-ink border border-ko-line/20 rounded-lg py-3 mb-4"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {err && <div className="text-ko-alert text-sm mb-4">{err}</div>}
        <button
          onClick={submit}
          disabled={loading || pin.length < 4}
          className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg disabled:opacity-40"
        >
          {loading ? "Verifica..." : "Entra"}
        </button>
      </div>
    </main>
  );
}
