declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;
            GEMINI_API_KEY: string;
            NEXTAUTH_URL: string;
            NEXTAUTH_SECRET: string;
            // Azure Computer Vision API for OCR
            AZURE_COMPUTER_VISION_ENDPOINT: string;
            AZURE_COMPUTER_VISION_KEY: string;
            AZURE_COMPUTER_VISION_REGION: string;
        }
    }
}