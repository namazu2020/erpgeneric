import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rutas públicas que no requieren autenticación
    const publicPaths = ["/login", "/register", "/api/auth", "/setup"];
    if (publicPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Checking for session cookie
    // Better Auth uses "better-auth.session_token" by default
    // We can also retrieve it from the header "cookie" to be safe
    const cookieName = "better-auth.session_token";
    const sessionToken = request.cookies.get(cookieName)?.value;

    if (!sessionToken && !pathname.startsWith('/api')) {
        // Redirect to login if accessing protected page without session
        // Ignoramos /api para no redirigir llamadas AJAX, dejamos que fallen con 401 si es necesario en su propio handler
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public images
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
