import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@/lib/supabaseAdapter";

export const authOptions: AuthOptions = {
    adapter: SupabaseAdapter(),
    debug: process.env.NODE_ENV !== "production", // Enable debug mode in development
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async redirect({ url, baseUrl }) {
            // Handle production domain explicitly
            const productionDomain = "https://sonneai.com";

            // Check if on production domain
            if (process.env.NODE_ENV === 'production' && url.startsWith(productionDomain)) {
                return url;
            }

            // Allow OAuth callback URLs through
            if (url.includes('/api/auth/callback/')) {
                return url;
            }

            // Handle relative URLs
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }

            // Allow internal URLs
            if (url.startsWith(baseUrl)) {
                return url;
            }

            // Default fallback to base URL
            return baseUrl;
        },
    },
    useSecureCookies: process.env.NODE_ENV === "production",
};