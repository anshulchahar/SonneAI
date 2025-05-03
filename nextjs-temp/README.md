# Sonne (Next.js Version)

Welcome to Sonne! This application leverages AI to provide insightful analysis of your PDF documents. It's built using modern web technologies for a fast, responsive, and feature-rich experience.

## Features and Technologies

- **Framework:** [Next.js 14](https://nextjs.org/) - React framework with App Router for server-side rendering and API routes
- **UI Components:** [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) - Flexible authentication for Next.js applications
- **AI Integration:** [Google Gemini API](https://ai.google.dev/) - Advanced AI models for document analysis
- **Database:** [Supabase](https://supabase.io/) - An open source Firebase alternative with PostgreSQL database
- **PDF Processing:** [pdf-parse](https://www.npmjs.com/package/pdf-parse) - JavaScript library for extracting text from PDFs
- **File Handling:** [react-dropzone](https://react-dropzone.js.org/) - React hook for file uploads

## Getting Started

Follow these steps to set up the project locally for development.

### Prerequisites

- **Node.js:** Version 18 or higher. Download from [nodejs.org](https://nodejs.org/).
- **Package Manager:** `npm` (comes with Node.js) or `yarn`.
- **Google Cloud Project:**
    - **OAuth Credentials:** You'll need a Client ID and Client Secret for Google OAuth. Set up an OAuth 2.0 consent screen and credentials in the [Google Cloud Console](https://console.cloud.google.com/). Ensure `http://localhost:3000/api/auth/callback/google` is added as an authorized redirect URI during development.
    - **Gemini API Key:** Enable the Gemini API in your Google Cloud project and generate an API key.
- **Git:** For cloning the repository.

### Installation

1.  **Clone the Repository:**
    ```bash
    # Replace <repository-url> with the actual URL
    git clone <repository-url>
    cd sonne
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or if you prefer yarn:
    # yarn install
    ```

3.  **Set Up Environment Variables:**
    Create a file named `.env` in the root directory of the project. Copy the contents of `.env.example` (if it exists) or add the following variables, replacing the placeholder values with your actual credentials:

    ```env
    # Database connection string (Supabase URL and key)
    SUPABASE_URL="your-supabase-url"
    SUPABASE_KEY="your-supabase-key"

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"

    # Google Gemini API Key
    GEMINI_API_KEY="your-gemini-api-key"

    # NextAuth Configuration
    # The base URL of your application
    NEXTAUTH_URL="http://localhost:3000"
    # A secret used to sign tokens and cookies. Generate one using: openssl rand -base64 32
    NEXTAUTH_SECRET="your-secure-random-string"
    ```
    **Important:** Never commit your `.env` file to version control. Add it to your `.gitignore` file.

4.  **Initialize and Prepare the Database:**
    Run the SQL commands in the `supabase-schema.sql` file in your Supabase SQL editor to set up the database schema. You can access the SQL editor from your Supabase dashboard.

5.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    This command starts the Next.js development server.

The application should now be running and accessible at `http://localhost:3000`.

## Migrating from Flask Version

If you're migrating from the Flask version:

1. Copy your existing environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GEMINI_API_KEY`

2. Generate a new `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

3. Update your Google OAuth configuration to include the new callback URL:
   - Add `http://localhost:3000/api/auth/callback/google` to your authorized redirect URIs

Your existing PDF files and analysis data will need to be manually migrated to the new system.

## Deployment

Instructions for deploying the application will vary depending on your chosen platform (e.g., Vercel, Netlify, AWS).

Ensure you set the necessary environment variables on your deployment platform. You might need to configure the `NEXTAUTH_URL` to match your production domain.

For database deployment, consider using Supabase for production environments.

## Architecture

The project follows a standard Next.js application structure:

-   `src/app/`: Contains the core application logic, including pages, layouts, API routes, and loading/error states, following the Next.js App Router conventions.
    -   `(auth)/`: Route group for authentication-related pages (e.g., login).
    -   `(dashboard)/`: Route group for protected dashboard pages.
    -   `api/`: Location for backend API endpoints handled by Next.js.
-   `src/components/`: Shared React components used across different pages.
    -   `ui/`: Often contains primitive UI components, potentially integrated with a UI library like Shadcn/ui.
    -   `auth/`: Components specific to authentication flows.
    -   `dashboard/`: Components specific to the main application dashboard.
-   `src/lib/` or `src/utils/`: Utility functions, helper scripts, configuration files (e.g., Supabase client instance, AI client setup).
-   `public/`: Static assets like images, fonts, etc., accessible directly via the root URL.
-   `tailwind.config.ts`, `postcss.config.js`: Configuration files for Tailwind CSS.
-   `next.config.mjs`: Configuration file for Next.js.
-   `tsconfig.json`: TypeScript configuration file.

## API Routes

API endpoints are defined within `src/app/api/`.

-   `POST /api/analyze`
    -   **Purpose:** Handles the uploading and analysis of PDF documents.
    -   **Auth:** Requires authentication.
    -   **Request Body:** Typically expects form data containing the PDF file(s).
    -   **Response:** Returns the analysis results or an error message.
-   `GET /api/history`
    -   **Purpose:** Fetches the analysis history for the currently authenticated user.
    -   **Auth:** Requires authentication.
    -   **Response:** Returns a list of past analyses (e.g., document names, dates, analysis IDs).
-   `GET /api/analysis/[id]`
    -   **Purpose:** Retrieves the detailed results of a specific analysis by its ID.
    -   **Auth:** Requires authentication and authorization (user must own the analysis).
    -   **Response:** Returns the detailed analysis data for the specified ID.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
