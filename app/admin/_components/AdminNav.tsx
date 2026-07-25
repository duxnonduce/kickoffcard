"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/operazioni", label: "Operazioni" },
  { href: "/admin/clients", label: "Clienti" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setAdminName(d.admin?.full_name ?? null))
      .catch(() => {});
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-20 -mx-8 px-8 py-4 mb-8 bg-ko-ink/90 backdrop-blur border-b border-ko-line/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-ko-whistle" />
            <span className="text-ko-whistle text-xs tracking-widest font-display">KICK OFF</span>
            <span className="text-ko-line/30 text-xs">/ admin</span>
          </div>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
                  isActive(l.href)
                    ? "bg-ko-whistle text-ko-ink"
                    : "text-ko-line/60 hover:text-ko-line hover:bg-ko-line/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {adminName && <span className="text-sm text-ko-line/50">{adminName}</span>}
          <button onClick={logout} className="text-sm text-ko-line/50 hover:text-ko-alert transition">
            Esci
          </button>
        </div>
      </div>
    </header>
  );
}
