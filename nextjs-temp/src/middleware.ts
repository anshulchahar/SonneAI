import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const isAuthenticated = !!token;

    // Get the pathname of the request
    const pathname = req.nextUrl.pathname;

    // If someone tries to access the old signin page (which no longer exists),
    // either redirect to home (if authenticated) or to the built-in NextAuth sign-in
    if (pathname.startsWith('/auth/signin')) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/', req.url));
        } else {
            return NextResponse.redirect(new URL('/api/auth/signin', req.url));
        }
    }

    // Set x-forwarded-host header for OAuth callback
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-forwarded-host", req.headers.get("host") || "localhost");

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}