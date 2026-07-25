"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  codice_fiscale: string;
  email: string | null;
  phone: string | null;
};

export default function AdminClientsPage() {
  const [q, setQ] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);

  async function search() {
    const res = await fetch(`/api/admin/clients?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setClients(data.clients ?? []);
  }

  useEffect(() => {
    search();
  }, []);

  return (
    <main className="min-h-screen px-8 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF · ADMIN</div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-ko-line/60 hover:text-ko-line">Dashboard</Link>
          <Link href="/admin/clients" className="text-ko-whistle">Clienti</Link>
          <Link href="/admin/audit" className="text-ko-line/60 hover:text-ko-line">Audit log</Link>
        </nav>
      </header>

      <h1 className="font-display text-3xl mb-4">Anagrafica clienti</h1>
      <div className="flex gap-3 mb-6 max-w-lg">
        <input
          className="flex-1 bg-ko-ink border border-ko-line/20 rounded-lg py-2.5 px-3"
          placeholder="Nome, cognome, codice fiscale o telefono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <button onClick={search} className="bg-ko-whistle text-ko-ink font-display px-5 py-2.5 rounded-lg">Cerca</button>
      </div>

      <table className="w-full text-sm">
        <thead className="text-ko-line/50 text-left">
          <tr><th className="pb-2">Nome</th><th>Codice fiscale</th><th>Contatti</th><th></th></tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-t border-ko-line/10">
              <td className="py-2">{c.first_name} {c.last_name}</td>
              <td className="font-mono">{c.codice_fiscale}</td>
              <td>{c.phone ?? "—"} {c.email ? `· ${c.email}` : ""}</td>
              <td className="text-right">
                <Link href={`/admin/clients/${c.id}`} className="text-ko-whistle hover:underline">Dettaglio →</Link>
              </td>
            </tr>
          ))}
          {clients.length === 0 && (
            <tr><td colSpan={4} className="text-ko-line/50 py-6 text-center">Nessun cliente trovato.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
