# Sonne (Next.js Version)

Welcome to Sonne! This application leverages AI to provide insightful analysis of your PDF documents. It's built using modern web technologies for a fast, responsive, and feature-rich experience.

## Features

- **AI-Powered Analysis:** Utilizes Google's Gemini AI to understand and summarize PDF content, extract key information, and answer questions about the documents.
- **Secure Authentication:** Integrates with Google OAuth for easy and secure user login via NextAuth.js.
- **Document History:** Keeps track of previously analyzed documents and their results for easy access.
- **Multi-File Comparison:** Allows users to upload and compare multiple documents simultaneously (feature details TBD).
- **Modern UI:** Built with Tailwind CSS for a clean, responsive, and customizable user interface.
- **Server-Side Rendering (SSR):** Leverages Next.js for improved performance and SEO.
- **Type Safety:** Developed with TypeScript for enhanced code quality and maintainability.

## Technologies Used

- **Frontend Framework:** [Next.js](https://nextjs.org/) (React framework) - Chosen for its features like SSR, routing, API routes, and overall developer experience.
- **UI Library:** [React](https://reactjs.org/) - The core library for building user interfaces.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
- **Backend:** [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Used for creating serverless API endpoints within the Next.js application.
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) - Simplifies authentication implementation, configured here with the Google OAuth provider.
- **Database ORM:** [Prisma](https://www.prisma.io/) - A modern database toolkit making database access easy and type-safe. Configured with SQLite for development.
- **AI Model:** [Google Gemini API](https://ai.google.dev/) - Provides the core AI capabilities for document analysis.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Adds static typing to JavaScript, improving code reliability and developer productivity.

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
    # Database connection string (SQLite file in prisma folder)
    DATABASE_URL="file:./dev.db"

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
    These commands use Prisma to:
    - `db push`: Synchronize your database schema with the Prisma schema file (`prisma/schema.prisma`). Creates the SQLite database file (`dev.db`) if it doesn't exist.
    - `generate`: Generate the Prisma Client based on your schema, providing type-safe database access.
    ```bash
    npx prisma db push
    npx prisma generate
    ```

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

For database deployment, consider using a managed database service compatible with Prisma instead of SQLite for production environments.

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
-   `src/lib/` or `src/utils/`: Utility functions, helper scripts, configuration files (e.g., Prisma client instance, AI client setup).
-   `prisma/`: Contains database-related files.
    -   `schema.prisma`: Defines the database schema.
    -   `migrations/`: Stores database migration history (used with `prisma migrate dev`).
    -   `dev.db`: The SQLite database file (for development).
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
