import { NextRequest, NextResponse } from "next/server";
import { getReceptionSession } from "@/lib/auth/receptionSession";
import { createClient } from "@/lib/supabase/server";

// Protegge /reception/* (richiede sessione PIN) e /admin/* (richiede utente
// Supabase Auth registrato come admin). Le pagine di login restano libere.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/reception") && !pathname.startsWith("/reception/login")) {
    const session = await getReceptionSession();
    if (!session) {
      return NextResponse.redirect(new URL("/reception/login", req.url));
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  if (
    pathname.startsWith("/cliente") &&
    !pathname.startsWith("/cliente/login") &&
    !pathname.startsWith("/cliente/registrati")
  ) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/cliente/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/reception/:path*", "/admin/:path*", "/cliente/:path*"],
};
