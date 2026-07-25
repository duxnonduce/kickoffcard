import { Resend } from "resend";

const resend = () => new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.KICKOFF_FROM_EMAIL || "Kick Off <notifiche@kickoff.local>";

function wrapper(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; background:#0A1F2B; padding:32px 16px;">
    <div style="max-width:480px; margin:0 auto; background:#0F4C3A; border-radius:16px; padding:28px; color:#F7F5EF;">
      <div style="color:#F2A93B; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">Kick Off</div>
      <h1 style="font-size:22px; margin:0 0 16px;">${title}</h1>
      <div style="font-size:14px; line-height:1.6; color:#F7F5EFcc;">${bodyHtml}</div>
      <div style="margin-top:24px; padding-top:16px; border-top:1px solid #F7F5EF22; font-size:11px; color:#F7F5EF66;">
        Ricevi questa email perché hai un account Kick Off collegato alle tue tessere.
      </div>
    </div>
  </div>`;
}

export async function sendPurchaseEmail(params: {
  to: string; firstName: string; sportName: string; totalEntries: number; price: number; expiryDate: string | null;
}) {
  if (!process.env.RESEND_API_KEY) return; // in sviluppo senza chiave configurata, salta silenziosamente
  const html = wrapper(
    "Nuovo pacchetto attivato",
    `<p>Ciao ${params.firstName},</p>
     <p>abbiamo attivato sulla tua tessera un nuovo pacchetto <strong>${params.sportName}</strong>:
     ${params.totalEntries} ingressi, €${params.price.toFixed(2)}.</p>
     ${params.expiryDate ? `<p>Scadenza: ${new Date(params.expiryDate).toLocaleDateString("it-IT")}.</p>` : ""}
     <p>Puoi vedere lo stato aggiornato in ogni momento nella tua area riservata.</p>`
  );
  await resend().emails.send({ from: FROM, to: params.to, subject: `Nuovo pacchetto ${params.sportName} attivato`, html });
}

export async function sendExpiryReminderEmail(params: {
  to: string; firstName: string; sportName: string; daysLeft: number; expiryDate: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const html = wrapper(
    "Il tuo pacchetto sta per scadere",
    `<p>Ciao ${params.firstName},</p>
     <p>il tuo pacchetto <strong>${params.sportName}</strong> scade tra ${params.daysLeft} giorni
     (${new Date(params.expiryDate).toLocaleDateString("it-IT")}).</p>
     <p>Passa in reception se vuoi rinnovarlo o completare gli ingressi rimasti.</p>`
  );
  await resend().emails.send({ from: FROM, to: params.to, subject: `Il tuo pacchetto ${params.sportName} scade tra ${params.daysLeft} giorni`, html });
}

export async function sendExpiredEmail(params: { to: string; firstName: string; sportName: string }) {
  if (!process.env.RESEND_API_KEY) return;
  const html = wrapper(
    "Pacchetto scaduto",
    `<p>Ciao ${params.firstName},</p>
     <p>il tuo pacchetto <strong>${params.sportName}</strong> è scaduto. Se vuoi continuare a giocare,
     passa in reception per attivarne uno nuovo.</p>`
  );
  await resend().emails.send({ from: FROM, to: params.to, subject: `Il tuo pacchetto ${params.sportName} è scaduto`, html });
}
