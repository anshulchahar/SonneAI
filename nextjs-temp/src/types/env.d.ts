declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;
            GEMINI_API_KEY: string;
            NEXTAUTH_URL: string;
            NEXTAUTH_SECRET: string;
        }
    }
}