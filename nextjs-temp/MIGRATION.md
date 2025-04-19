# Sonne Migration Guide

This document provides instructions for migrating from the Flask version of Sonne to the Next.js version.

## Migration Steps

### 1. Environment Variables

Copy your existing environment variables from `.env` or environment to the new Next.js `.env` file:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"  # New SQLite path for Prisma

# Authentication (Copy from Flask version)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret" 

# API Keys (Copy from Flask version)
GEMINI_API_KEY="your-gemini-api-key"

# New environment variables needed for Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"  # Generate with: openssl rand -base64 32
```

### 2. OAuth Configuration

Update your Google OAuth configuration in the Google Cloud Console:

1. Add `http://localhost:3000/api/auth/callback/google` to your authorized redirect URIs
2. Add `http://localhost:3000` to your authorized JavaScript origins

### 3. Database Migration

The Next.js version uses Prisma with SQLite by default. To migrate your data from the Flask SQLite database:

1. Install the required dependencies:
   ```bash
   cd nextjs-temp
   npm install
   ```

2. Run the database migration script:
   ```bash
   npx tsx scripts/migrate-data.ts
   ```

This script will:
- Connect to your old Flask SQLite database
- Migrate users, their authentication information, and analysis history
- Create equivalent records in the Prisma database

### 4. PDF Files and Assets

Copy any PDF files and assets from the Flask version's `uploads/` directory to a suitable location in your Next.js project.

### 5. Running Both Versions Side-by-Side

During the transition, you can run both versions side-by-side:

- Flask version: `python app.py` (default port: 5000)
- Next.js version: `npm run dev` (default port: 3000)

### 6. Verifying the Migration

After migrating:

1. Verify user accounts were migrated correctly by logging in
2. Check that analysis history is available
3. Try the document analysis functionality to ensure it works as expected

## Key Differences

### Authentication Flow

- Flask: OAuth flow handled by Flask-Login
- Next.js: OAuth flow handled by NextAuth.js

### API Routes

- Flask: `/api/analyze`, `/api/history`
- Next.js: `/api/analyze`, `/api/history`, `/api/analysis/[id]`

### Database

- Flask: SQLite with SQLAlchemy
- Next.js: SQLite with Prisma (can be easily switched to PostgreSQL, MySQL, etc.)

### Deployment

- Flask: Various options (Heroku, Docker, etc.)
- Next.js: Optimized for Vercel, but can be deployed anywhere Node.js is supported

## Troubleshooting

### Authentication Issues

If you experience authentication issues:
- Ensure Google OAuth credentials are updated with new redirect URIs
- Check that the `NEXTAUTH_URL` environment variable matches your actual URL
- Verify that `NEXTAUTH_SECRET` is properly set

### Database Connection Issues

If the migration script fails:
- Ensure the old database path is correct
- Check that the Prisma schema matches your needs
- Run `npx prisma db push` to ensure the schema is applied

### Missing Analyses

If analyses are missing:
- Check the database migration logs
- Verify that user IDs were correctly mapped from the old database to the new one