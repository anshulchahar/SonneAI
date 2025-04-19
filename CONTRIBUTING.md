# Contributing to Sonne

Thank you for your interest in contributing to Sonne! This document provides guidelines and instructions to help you get started.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js 16.x or higher (Check project's specific requirements if available)
- npm (usually comes with Node.js)
- Git
- Prisma CLI (can be installed via npm)

### Setting Up Your Development Environment

1.  Fork the repository on GitHub
2.  Clone your fork locally:
    ```bash
    git clone https://github.com/YOUR-USERNAME/sonne.git
    cd sonne/nextjs-temp # Navigate into the Next.js project directory
    ```
3.  Set up the development environment:
    ```bash
    # Install dependencies
    npm install

    # Set up the database (ensure your .env file is configured if needed)
    npx prisma generate
    npx prisma db push # Apply schema changes to your local database
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### Development Workflow

1.  Create a new branch for your feature or bugfix:
    ```bash
    git checkout -b feature/your-feature-name
    ```
2.  Make your changes and commit them with clear, descriptive commit messages:
    ```bash
    git commit -am "feat: Add feature: brief description" # Example using conventional commits
    ```
3.  Push your branch to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
4.  Submit a pull request to the main repository's `main` branch.

### Pull Request Process

1.  Update the README.md or documentation (`/docs`) with details of changes if appropriate.
2.  Ensure your code passes linting checks:
    ```bash
    npm run lint
    ```
3.  Add tests for new functionality if applicable (Note: Testing setup might need to be added).
4.  Ensure your code follows the project's coding standards.
5.  Your PR will be reviewed by at least one maintainer.
6.  Address any feedback from the code review.

### Coding Standards

1.  Follow the configured ESLint rules (`npm run lint` to check).
2.  Use meaningful variable and function names.
3.  Write TSDoc/JSDoc comments for functions, classes, and complex logic.
4.  Keep functions focused on a single responsibility.
5.  Follow Next.js and React best practices.

### Testing

1.  Write tests for new features and bug fixes where applicable. (Note: A testing framework like Jest or Vitest might need to be configured).
2.  Ensure any existing tests pass before submitting your PR.

### Documentation
1. Update documentation for any new features or changes
2. Use clear and concise language
3. Provide examples where appropriate

### Reporting Bugs
1. Report bugs by creating issues on GitHub with:
    - A clear description of the issue
    - Steps to reproduce the behavior
    - Expected behavior
    - Screenshots if applicable
    - Any additional context

### Feature Requests
1. Feature requests are welcome! Please provide:
    - A clear description of the feature
    - The motivation or use case for the feature
    - Any ideas for implementation

### Questions or Need Help?
Feel free to open an issue with your questions or reach out to the maintainers.

Thank you for contributing to Sonne!