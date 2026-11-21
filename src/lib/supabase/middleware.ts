import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Chemins réservés à certains rôles — vérifiés directement dans le
 * middleware (donc avant même le rendu de la page) pour une défense en
 * profondeur. Les policies RLS restent la protection de référence côté
 * données ; ceci évite en plus d'afficher une page interdite.
 */
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: string[] }[] = [
  { prefix: "/dashboard/admin", roles: ["admin", "super_admin"] },
  { prefix: "/dashboard/technicien", roles: ["technicien", "admin", "super_admin"] },
  { prefix: "/dashboard/support", roles: ["support", "admin", "super_admin"] },
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT : ne pas retirer ce getUser(), il rafraîchit le token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Protection par rôle sur les sections sensibles.
  if (user) {
    const restriction = ROLE_RESTRICTED_PREFIXES.find((r) => pathname.startsWith(r.prefix));
    if (restriction) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

      if (!profile || !restriction.roles.includes(profile.role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.searchParams.set("error", "acces_refuse");
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
