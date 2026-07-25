"use client";
import AdminNav from "../_components/AdminNav";
import CardOperationsPanel from "@/components/CardOperationsPanel";

export default function AdminOperazioniPage() {
  return (
    <main className="min-h-screen px-8 py-6">
      <AdminNav />
      <h1 className="font-display text-3xl mb-1">Operazioni su card</h1>
      <p className="text-ko-line/50 text-sm mb-6">
        Stessa procedura della reception: scansiona o digita un codice per associare una card, vendere un pacchetto o registrare un ingresso.
      </p>
      <CardOperationsPanel />
    </main>
  );
}
