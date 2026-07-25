"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function submit() {
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setErr(error.message);
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-ko-field/40 border border-ko-line/10 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-ko-whistle text-xs tracking-widest font-display mb-2">KICK OFF · ADMIN</div>
        <h1 className="font-display text-3xl mb-6">Accesso amministratore</h1>
        <input className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" className="w-full bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3 mb-4" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div className="text-ko-alert text-sm mb-4">{err}</div>}
        <button onClick={submit} className="w-full bg-ko-whistle text-ko-ink font-display tracking-wide py-3 rounded-lg">Entra</button>
      </div>
    </main>
  );
}
