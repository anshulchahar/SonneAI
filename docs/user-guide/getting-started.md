# Getting Started with Sonne

This guide will help you install, configure, and start using Sonne for your document analysis needs.

## Installation

### Prerequisites

Before installing Sonne, ensure you have the following:

- Node.js 18.x or higher
- npm or yarn package manager
- Google Gemini API key

### Step 1: Clone the Repository

```bash
git clone https://github.com/anshulchahar/sonne.git
cd sonne
```

### Step 2: Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the project root directory with your API keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"
```

### Step 4: Set Up the Database

Initialize the database with Prisma:

```bash
npx prisma generate
npx prisma db push
```

## Running the Application

Start the development server:

```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

The application will be available at `http://localhost:3000`.

## First Steps

1. **Sign In**: Create an account or sign in using the authentication options provided.
2. **Upload a Document**: Navigate to the main page and upload a PDF document using the file uploader.
3. **Process the Document**: The application will automatically process the document and display the analysis results.
4. **Review Results**: View the extracted text, summaries, and key points identified by the AI.

## Production Deployment

To build the application for production:

```bash
# Using npm
npm run build
npm start

# Using yarn
yarn build
yarn start

# Using pnpm
pnpm build
pnpm start
```

## Next Steps

- Learn about the different [Features](features.md) available in Sonne
- See [Usage Examples](examples.md) for common use cases
- Explore the [API Reference](../api-reference/app-routes.md) for programmatic usage
- Check out the [Development Guide](../development/contributing.md) to contribute to the project