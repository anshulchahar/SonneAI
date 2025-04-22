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

    // Use the original request headers without modifying them
    // This should prevent duplicate CSP headers from being added
    const response = NextResponse.next();

    // Only add x-forwarded-host for auth-related requests if it doesn't exist
    if (pathname.includes('/api/auth/callback/')) {
        const requestHeaders = new Headers(req.headers);
        if (!requestHeaders.has("x-forwarded-host")) {
            requestHeaders.set("x-forwarded-host", req.headers.get("host") || "localhost");
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    return response;
}