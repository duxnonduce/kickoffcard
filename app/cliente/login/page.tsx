"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import Logo from "@/components/Logo";

export default function ClienteLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function submit() {
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setErr(error.message);
    window.location.href = "/cliente";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="bg-ko-field/40 border border-ko-line/10 rounded-2xl p-7 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <h1 className="font-display text-2xl mb-6 text-center">Accedi</h1>
        <input className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-4" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div className="text-ko-alert text-sm mb-4">{err}</div>}
        <button onClick={submit} disabled={loading} className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg disabled:opacity-40">
          {loading ? "Accesso..." : "Entra"}
        </button>
        <div className="text-center mt-4 text-sm text-ko-line/50">
          Non hai un account? <Link href="/cliente/registrati" className="text-ko-whistle">Registrati</Link>
        </div>
      </div>
    </main>
  );
}
