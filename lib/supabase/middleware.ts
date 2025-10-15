import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth", "/portfolio"]
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/portfolio/")

  // Redirect to login if not authenticated (except for public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated, check role-based access
  if (user) {
    // Get user role from database
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const userRole = userData?.role || "client"

    // Admin routes protection
    if (pathname.startsWith("/admin")) {
      if (userRole !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "affiliate" ? "/affiliate/dashboard" : "/client/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Affiliate routes protection
    if (pathname.startsWith("/affiliate")) {
      if (userRole !== "affiliate") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "admin" ? "/admin/dashboard" : "/client/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // Client routes protection
    if (pathname.startsWith("/client")) {
      if (userRole !== "client") {
        const url = request.nextUrl.clone()
        url.pathname = userRole === "admin" ? "/admin/dashboard" : "/affiliate/dashboard"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
