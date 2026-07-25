import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="inline-block bg-ko-whistle text-ko-ink font-display text-sm tracking-widest px-3 py-1 rounded mb-4">
          KICK OFF
        </div>
        <h1 className="font-display text-4xl mb-6 tracking-wide">
          Tessere, pacchetti, ingressi.
        </h1>
        <div className="flex gap-3 justify-center">
          <Link href="/reception/login" className="bg-ko-field hover:bg-ko-fieldLight transition px-5 py-3 rounded-lg font-display tracking-wide">
            Accesso Reception
          </Link>
          <Link href="/admin/login" className="border border-ko-line/30 hover:border-ko-whistle transition px-5 py-3 rounded-lg font-display tracking-wide">
            Accesso Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
