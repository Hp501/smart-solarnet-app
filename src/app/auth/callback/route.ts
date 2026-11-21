import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Reçoit le lien de confirmation email (ou magic link) et échange le code
 * contre une session. Redirige ensuite vers le dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
