# Contributing to AIDrama Studio

Thank you for your interest in contributing! This guide will help you get started.

## Prerequisites

- Node.js >= 18.18.0 (see `.nvmrc`)
- Docker & Docker Compose (for MySQL, Redis, MinIO)
- npm >= 9.0.0

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/EvoLinkAI/ai-short-drama.git
   cd ai-short-drama
   ```

2. **Start infrastructure**
   ```bash
   docker compose up -d mysql redis minio
   ```

3. **Install dependencies**
   ```bash
   npm install
   cp .env.example .env  # edit as needed
   npx prisma db push
   ```

4. **Start development**
   ```bash
   npm run dev
   ```
   This starts Next.js (port 3000), worker, watchdog, and Bull Board (port 3010).

## Pull Request Process

1. Fork the repository and create a feature branch from `main`
2. Make your changes with clear, atomic commits following [Conventional Commits](https://www.conventionalcommits.org/)
3. Ensure all checks pass:
   ```bash
   npm run typecheck     # TypeScript compilation
   npm run lint:all      # ESLint
   npm run test:guards   # Architecture guard scripts
   npm run test:unit:all # Unit tests
   ```
4. Open a pull request with a clear description of changes

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- Use the project's structured logger (`src/lib/logging/`) instead of `console.log`
- All media access through `MediaObject` table with `storageKey` references
- Model keys always in `provider::modelId` format
- i18n: all user-facing strings in `messages/` (zh + en)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
