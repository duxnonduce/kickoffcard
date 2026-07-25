import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendExpiryReminderEmail, sendExpiredEmail } from "@/lib/email";

// Job giornaliero (Vercel Cron, vedi vercel.json) che:
// 1. marca come "expired" i pacchetti attivi la cui scadenza è passata,
//    inviando l'email "pacchetto scaduto"
// 2. invia un promemoria via email a 7 giorni e a 2 giorni dalla scadenza
//
// Non invia mai due volte lo stesso promemoria: controlla quante notifiche
// "in_scadenza" risultano già registrate per quel pacchetto (0 -> invia il
// promemoria dei 7 giorni, 1 -> invia quello dei 2 giorni, 2+ -> non fa nulla).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: packages } = await admin
    .from("packages")
    .select("id, client_id, sport_id, expiry_date, status, sports(name), clients(email, first_name)")
    .eq("status", "active")
    .not("expiry_date", "is", null);

  let expiredCount = 0;
  let reminderCount = 0;

  for (const pkg of packages ?? []) {
    const expiry = new Date(pkg.expiry_date as string);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / 86400000);

    const sport = Array.isArray(pkg.sports) ? pkg.sports[0] : pkg.sports;
    const client = Array.isArray(pkg.clients) ? pkg.clients[0] : pkg.clients;
    const sportName = (sport as any)?.name ?? "il tuo sport";
    const email = (client as any)?.email as string | null;
    const firstName = (client as any)?.first_name as string | undefined;

    if (daysLeft < 0) {
      await admin.from("packages").update({ status: "expired" }).eq("id", pkg.id);
      expiredCount++;
      if (email) {
        await sendExpiredEmail({ to: email, firstName: firstName ?? "", sportName });
        await admin.from("notifications").insert({ client_id: pkg.client_id, package_id: pkg.id, type: "scaduto" });
      }
      continue;
    }

    if (daysLeft <= 7 && email) {
      const { count } = await admin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("package_id", pkg.id)
        .eq("type", "in_scadenza");

      const alreadySent = count ?? 0;
      const shouldSendFirst = alreadySent === 0; // promemoria dei 7 giorni
      const shouldSendSecond = alreadySent === 1 && daysLeft <= 2; // promemoria dei 2 giorni

      if (shouldSendFirst || shouldSendSecond) {
        await sendExpiryReminderEmail({
          to: email,
          firstName: firstName ?? "",
          sportName,
          daysLeft,
          expiryDate: pkg.expiry_date as string,
        });
        await admin.from("notifications").insert({ client_id: pkg.client_id, package_id: pkg.id, type: "in_scadenza" });
        reminderCount++;
      }
    }
  }

  return NextResponse.json({ ok: true, expiredCount, reminderCount, checked: (packages ?? []).length });
}
