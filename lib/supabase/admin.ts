import { createClient } from "@supabase/supabase-js";

// Client con service role key: bypassa le RLS.
// Usato SOLO in Route Handlers server-side per: (1) le operazioni admin,
// (2) tutte le operazioni della reception, dove l'autorizzazione è
// applicata in codice invece che via RLS (vedi lib/auth/receptionSession.ts).
// Non importare mai questo file in un componente client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
