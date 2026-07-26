import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/reception/login" className="bg-ko-field hover:bg-ko-fieldLight transition px-5 py-3 rounded-lg font-display tracking-wide">
            Accesso Reception
          </Link>
          <Link href="/admin/login" className="border border-ko-line/30 hover:border-ko-whistle transition px-5 py-3 rounded-lg font-display tracking-wide">
            Accesso Admin
          </Link>
          <Link href="/cliente/login" className="border border-ko-whistle text-ko-whistle hover:bg-ko-whistle hover:text-ko-ink transition px-5 py-3 rounded-lg font-display tracking-wide">
            Area Cliente
          </Link>
        </div>
      </div>
    </main>
  );
}
