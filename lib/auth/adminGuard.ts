import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Verifica che l'utente Supabase Auth corrente sia registrato come admin.
// Da chiamare all'inizio di ogni Route Handler /api/admin/*.
export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non autenticato", status: 401 as const, admin: null };

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admins")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) return { error: "Non autorizzato", status: 403 as const, admin: null };

  return { error: null, status: 200 as const, admin: adminRow };
}
