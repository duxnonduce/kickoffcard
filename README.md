# Kick Off — Fase 1 (core gestionale)

## Cosa è già implementato

- Schema DB completo (`supabase/migrations/0001_init.sql`)
- Login reception via PIN (sessione JWT httpOnly, 12h)
- Login admin via Supabase Auth (email/password)
- Middleware che protegge `/admin/*` e `/reception/*`
- Flusso completo: scan card → associazione cliente (con anagrafica + codice
  fiscale) → vendita pacchetto (sport, ingressi, prezzo, scadenza opzionale)
  → check-in con scalo ingressi (quantità variabile)
- Audit log automatico su ogni azione sensibile
- Pannello admin: caricamento nuove card in lotto, creazione account
  reception, vista card/stato
- Pannello admin → **Clienti**: ricerca anagrafica, dettaglio cliente con
  storico completo pacchetti (anche chiusi/scaduti) e storico ingressi
- Pannello admin → **Audit log**: registro filtrabile di ogni azione, con
  nome dell'operatore (admin o reception) che l'ha eseguita
- Annullamento ingresso errato: direttamente dalla scheda cliente
  (`/admin/clients/[id]`), riservato all'admin

## Cosa manca (fasi successive, come da documento architetturale)

- **Fase 2**: registrazione/area cliente, collegamento via codice fiscale,
  vista card + pacchetti + storico da smartphone
- **Fase 3**: notifiche email (Resend) — acquisto, promemoria scadenza, scaduto
- **Fase 4**: Apple Wallet / Google Wallet
- Job di scadenza pacchetti (cron giornaliero che marca `status='expired'`
  i pacchetti oltre `expiry_date` e alimenta le notifiche di Fase 3)
- Primo account admin: va creato manualmente in Supabase Auth, poi bisogna
  inserire la riga corrispondente in `admins` con lo stesso `id`

## Setup — solo interfacce web, nessun terminale

**1. Supabase (dashboard web)**
- Crea un nuovo progetto Supabase dedicato a Kick Off (separato da PointLab)
- Vai su **SQL Editor** → incolla il contenuto di `supabase/migrations/0001_init.sql` → **Run**
- Vai su **Authentication → Users → Add user** e crea il tuo utente admin (email + password)
- Copia l'`id` (UUID) generato per quell'utente
- Vai su **Table Editor → admins → Insert row** e crea una riga con quello stesso `id` come `id`, e il tuo nome in `full_name`
- Da **Project Settings → API** copia: `Project URL`, `anon public key`, `service_role key` — ti serviranno per Vercel

**2. GitHub (dashboard web)**
- Crea un nuovo repository (es. `kickoff`)
- Carica tutti i file di questo progetto tramite l'interfaccia "Upload files" di GitHub (drag & drop della cartella scompattata, o del contenuto dello zip)

**3. Vercel (dashboard web)**
- **Add New → Project** → importa il repository GitHub appena creato
- Vercel rileva automaticamente che è un progetto Next.js e configura da solo build/install: non serve fare nulla in locale
- In **Environment Variables** aggiungi:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RECEPTION_SESSION_SECRET` (una stringa lunga a caso, es. generata da un password manager)
- **Deploy**

Fatto: il sito è online. Ogni volta che ti preparo dei file aggiornati, basta ricaricarli su GitHub (sovrascrivendo quelli esistenti) e Vercel rifà il deploy da solo.

## Note di design

- Reception e Admin: layout desktop, orizzontale, ottimizzato per operatività
  rapida al banco (campo scan sempre a fuoco, invio da tastiera)
- L'area cliente (Fase 2) sarà invece mobile-first
- Palette e tipografia: brand Kick Off, distinto da PointLab (verde campo /
  arancio fischietto, Anton per i titoli)
