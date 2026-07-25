import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReceptionSession } from "@/lib/auth/receptionSession";

export type Actor = { type: "admin" | "receptionist"; id: string; label: string };

// La maggior parte delle route operative (scan, link, vendita, check-in)
// possono essere eseguite sia da admin che da reception: questa funzione
// identifica CHI sta chiamando, da usare per audit_log e per i campi
// *_by_type / *_by_id sulle tabelle.
export async function requireActor(): Promise<Actor | null> {
  const reception = await getReceptionSession();
  if (reception) {
    return { type: "receptionist", id: reception.receptionistId, label: reception.fullName };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("admins")
    .select("id, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminRow) return null;
  return { type: "admin", id: adminRow.id, label: adminRow.full_name };
}
