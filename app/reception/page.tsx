"use client";
import CardOperationsPanel from "@/components/CardOperationsPanel";

export default function ReceptionDashboard() {
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

      <CardOperationsPanel />
    </main>
  );
}
