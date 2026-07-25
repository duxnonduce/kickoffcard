"use client";
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { createClient } from "@/lib/supabase/browser";

type ClientProfile = { id: string; first_name: string; last_name: string; codice_fiscale: string; email: string | null; phone: string | null };
type CardRow = { id: string; barcode: string; status: string };
type PackageRow = {
  id: string; card_id: string; total_entries: number; remaining_entries: number;
  price: number; expiry_date: string | null; status: string; sold_at: string;
  sports: { name: string } | null;
};
type EntryLog = { id: string; entries_deducted: number; performed_at: string; package_id: string };

const statusLabel: Record<string, string> = {
  active: "Attivo", exhausted: "Esaurito", expired: "Scaduto", cancelled: "Annullato",
};

export default function ClienteDashboard() {
  const supabase = createClient();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [entryLogs, setEntryLogs] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/cliente/login";
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select("id, first_name, last_name, codice_fiscale, email, phone")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!client) {
        window.location.href = "/cliente/collega";
        return;
      }
      setProfile(client);

      const [{ data: cardsData }, { data: pkgData }, { data: logsData }] = await Promise.all([
        supabase.from("cards").select("id, barcode, status").eq("client_id", client.id),
        supabase
          .from("packages")
          .select("id, card_id, total_entries, remaining_entries, price, expiry_date, status, sold_at, sports(name)")
          .eq("client_id", client.id)
          .order("sold_at", { ascending: false }),
        supabase
          .from("entry_logs")
          .select("id, entries_deducted, performed_at, package_id")
          .eq("client_id", client.id)
          .eq("reversed", false)
          .order("performed_at", { ascending: false })
          .limit(15),
      ]);

      setCards(cardsData ?? []);
      setPackages(pkgData ?? []);
      setEntryLogs(logsData ?? []);
      setLoading(false);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/cliente/login";
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center text-ko-line/50">Caricamento...</main>;
  if (!profile) return null;

  const activePackages = packages.filter((p) => p.status === "active");
  const pastPackages = packages.filter((p) => p.status !== "active");

  return (
    <main className="min-h-screen px-4 py-6 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-5">
        <div className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF</div>
        <button onClick={logout} className="text-sm text-ko-line/50">Esci</button>
      </header>

      <h1 className="font-display text-3xl mb-4">Ciao, {profile.first_name}</h1>

      {cards.map((c) => (
        <DigitalCard key={c.id} client={profile} card={c} />
      ))}

      <h2 className="font-display text-xl mt-6 mb-3">Pacchetti attivi</h2>
      {activePackages.length === 0 && <div className="text-ko-line/50 text-sm mb-4">Nessun pacchetto attivo al momento.</div>}
      <div className="flex flex-col gap-2 mb-6">
        {activePackages.map((p) => (
          <PackageCard key={p.id} pkg={p} />
        ))}
      </div>

      {pastPackages.length > 0 && (
        <>
          <h2 className="font-display text-xl mb-3">Storico pacchetti</h2>
          <div className="flex flex-col gap-2 mb-6">
            {pastPackages.map((p) => (
              <PackageCard key={p.id} pkg={p} muted />
            ))}
          </div>
        </>
      )}

      <h2 className="font-display text-xl mb-3">Ultimi ingressi</h2>
      <div className="flex flex-col gap-1.5 mb-10">
        {entryLogs.map((l) => (
          <div key={l.id} className="flex justify-between text-sm bg-ko-field/20 border border-ko-line/10 rounded-lg px-3 py-2">
            <span>{l.entries_deducted} ingresso/i</span>
            <span className="text-ko-line/50">{new Date(l.performed_at).toLocaleDateString("it-IT")}</span>
          </div>
        ))}
        {entryLogs.length === 0 && <div className="text-ko-line/50 text-sm">Nessun ingresso registrato ancora.</div>}
      </div>
    </main>
  );
}

function DigitalCard({ client, card }: { client: ClientProfile; card: CardRow }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      JsBarcode(svgRef.current, card.barcode, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 13,
        margin: 8,
        background: "transparent",
        lineColor: "#0A1F2B",
      });
    }
  }, [card.barcode]);

  return (
    <div className="relative bg-gradient-to-br from-ko-field to-ko-fieldLight rounded-2xl p-5 mb-4 overflow-hidden shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-ko-whistle text-[10px] tracking-widest uppercase">Tessera Kick Off</div>
          <div className="font-display text-2xl mt-0.5">{client.first_name} {client.last_name}</div>
        </div>
        <div className={`text-[10px] px-2 py-1 rounded-full font-medium ${card.status === "associata" ? "bg-ko-whistle text-ko-ink" : "bg-ko-line/20"}`}>
          {card.status === "associata" ? "Attiva" : card.status}
        </div>
      </div>
      <div className="bg-white rounded-lg p-2 flex justify-center">
        <svg ref={svgRef} />
      </div>
      <div className="text-center text-[11px] text-ko-line/60 mt-2">Mostra questo codice in reception</div>
    </div>
  );
}

function PackageCard({ pkg, muted = false }: { pkg: PackageRow; muted?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${muted ? "bg-ko-field/10 border-ko-line/5 opacity-60" : "bg-ko-field/25 border-ko-line/10"}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="font-display text-lg">{pkg.sports?.name ?? "Sport"}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-ko-line/10">{statusLabel[pkg.status] ?? pkg.status}</span>
      </div>
      <div className="text-sm text-ko-line/60">
        {pkg.remaining_entries} / {pkg.total_entries} ingressi
        {pkg.expiry_date ? ` · scade ${new Date(pkg.expiry_date).toLocaleDateString("it-IT")}` : ""}
      </div>
    </div>
  );
}
