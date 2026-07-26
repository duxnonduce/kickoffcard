"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import Logo from "@/components/Logo";

export default function ClienteRegistratiPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "checkEmail">("form");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function submit() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);

    if (data.session) {
      window.location.href = "/cliente/collega";
    } else {
      setStep("checkEmail");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="bg-ko-field/40 border border-ko-line/10 rounded-2xl p-7 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="font-display text-2xl mb-6 text-center">Crea il tuo account</h1>

        {step === "form" && (
          <>
            <input className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-4" placeholder="Password (min. 6 caratteri)" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            {err && <div className="text-ko-alert text-sm mb-4">{err}</div>}
            <button onClick={submit} disabled={loading || !email || password.length < 6} className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg disabled:opacity-40">
              {loading ? "Creazione..." : "Registrati"}
            </button>
            <div className="text-center mt-4 text-sm text-ko-line/50">
              Hai già un account? <Link href="/cliente/login" className="text-ko-whistle">Accedi</Link>
            </div>
          </>
        )}

        {step === "checkEmail" && (
          <div className="text-sm text-ko-line/70">
            Ti abbiamo inviato un'email di conferma a <strong>{email}</strong>. Aprila e clicca sul link, poi torna qui e accedi per completare la registrazione.
            <Link href="/cliente/login" className="block mt-4 text-ko-whistle text-center">Vai al login →</Link>
          </div>
        )}
      </div>
    </main>
  );
}
