# AIDrama Studio

<div align="center">

**AI-powered novel-to-video production platform**

Turn your novel, script, or story idea into a complete short drama video — fully automated.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Live Demo](https://aidrama.dev) · [Quick Start](#quick-start) · [FAQ](#faq) · [Contributing](CONTRIBUTING.md)

</div>

---

## What is AIDrama Studio?

AIDrama Studio is an open-source platform that turns text (novels, scripts, story ideas) into short drama videos using AI. The entire pipeline is automated:

```
Novel Text → AI Script Analysis → Storyboard → Images → Videos → Voiceover → Final Drama
```

You paste in your story, and the AI handles everything: extracting characters, generating consistent character images, creating shot-by-shot storyboards, producing video clips, adding voice acting, and assembling the final product.

**No video editing skills required. No design skills required. Just your story.**

---

## Demo Videos

AI-generated short dramas created entirely by AIDrama Studio — from text to video, fully automated:

<div align="center">

| | | |
|:---:|:---:|:---:|
| [▶ Romance](https://github.com/user-attachments/assets/a878aa89-4525-4912-93a7-a6ef868ba22a) | [▶ Sci-Fi](https://github.com/user-attachments/assets/bde9bf8c-dee0-441e-9e9f-81e29c32937d) | [▶ Action](https://github.com/user-attachments/assets/97cfebf2-7ed8-4e36-85f0-e3abbbd177fd) |
| [▶ Anime](https://github.com/user-attachments/assets/590efe50-be13-46fd-86db-9d5ace76ac4d) | [▶ Drama](https://github.com/user-attachments/assets/8f8303e9-b575-4368-ba14-9410283ce8c2) | [▶ Fantasy](https://github.com/user-attachments/assets/e11f0011-ac32-4e63-9a01-133bcbac97cc) |

</div>

> Generated using Seedance 2.0 video model. No manual editing. Try it yourself at [aidrama.dev](https://aidrama.dev).

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Script Analysis** | Paste a novel chapter and AI extracts characters, scenes, props, and plot structure automatically |
| **Character Workshop** | Generate consistent character images across all shots — same face, same outfit |
| **Scene Generation** | AI creates location backgrounds matching your story's setting |
| **Smart Storyboard** | Auto-generates shot-by-shot breakdown with camera angles, composition, and lighting |
| **Video Generation** | Multiple AI video models (Kling, Seedance 2.0, Vidu, etc.) generate each shot |
| **AI Voiceover** | Design unique voices for each character, generate lip-synced dialogue |
| **Bilingual UI** | Full Chinese / English interface, one-click switch |
| **One Key, All Models** | Just configure [EvoLink](https://evolink.ai/) — one API key unlocks text, image, video, and voice |

### AI Models

With a single [EvoLink](https://evolink.ai/) API key, you get access to:

| Type | Models |
|------|--------|
| **Text/LLM** | GPT-4o, Gemini, Claude, Doubao, Qwen, and more |
| **Image** | FLUX, Seedance, Kling, Imagen, DALL-E, and more |
| **Video** | Kling, Seedance 2.0, Vidu, Veo, MiniMax, and more |
| **Voice/TTS** | CosyVoice, and more |

> **No need to register with multiple AI providers.** [EvoLink](https://evolink.ai/) aggregates all major models behind a single API key. Register once, use everything. Advanced users can also configure individual provider keys if preferred.

---

## Quick Start

### Option 1: Docker (Recommended for beginners)

This is the easiest way. You only need [Docker Desktop](https://docs.docker.com/get-docker/) installed.

```bash
# 1. Clone the project
git clone https://github.com/EvoLinkAI/ai-short-drama.git
cd ai-short-drama

# 2. Start everything (MySQL, Redis, MinIO, App — all included)
docker compose up -d

# 3. Wait ~30 seconds, then open your browser
open http://localhost:23000
```

That's it! The first startup takes a bit longer as it builds the Docker image.

**What you'll see:**
- App: http://localhost:23000
- Queue Dashboard: http://localhost:23010 (admin/changeme)

**To stop:**
```bash
docker compose down
```

**To update:**
```bash
git pull
docker compose down
docker compose up -d --build
```

### Option 2: Local Development

For developers who want to modify the code.

**Prerequisites:**
- Node.js 18+ ([download](https://nodejs.org))
- Docker (for MySQL + Redis)

```bash
# 1. Clone and install
git clone https://github.com/EvoLinkAI/ai-short-drama.git
cd ai-short-drama
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum, set your AI provider API keys

# 3. Start database services
docker compose up mysql redis -d

# 4. Initialize database
npx prisma db push

# 5. Start dev server (with hot reload)
npm run dev
```

Visit http://localhost:3000

---

## First Steps After Launch

1. **Register an account** — Click "Sign Up" on the landing page
2. **Get an EvoLink API key** — Go to [evolink.ai](https://evolink.ai), register, and copy your API key
3. **Configure in Settings** — Paste your EvoLink API key in Settings → API Configuration
4. **Create your first project** — Click "Start Creating" and paste your story text
5. **Let AI do its thing** — The platform will analyze your text, generate characters, create storyboards, and produce videos

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict mode) |
| Database | MySQL 8.0 + Prisma ORM |
| Queue | Redis 7 + BullMQ (4 worker pools) |
| Storage | MinIO / S3-compatible (pluggable) |
| Auth | NextAuth.js v4 (JWT sessions) |
| i18n | next-intl (Chinese + English) |
| Styling | Tailwind CSS v4 |
| Video Editor | Remotion |
| Testing | Vitest (unit / integration / system / regression) |

---

## Architecture

```
src/
├── app/              # Next.js pages + 120+ API routes
├── components/       # Shared UI components
├── features/         # Video editor (Remotion)
├── lib/
│   ├── workers/      # BullMQ worker pools (image, video, voice, text)
│   ├── generators/   # Multi-provider media generation
│   ├── llm/          # Multi-provider LLM gateway
│   ├── billing/      # Usage tracking ledger
│   ├── storage/      # Pluggable storage (MinIO, local, COS, EvoLink)
│   ├── task/         # Task lifecycle + SSE streaming
│   └── media/        # Media object management
├── i18n/             # Internationalization config
messages/             # i18n translations (zh + en)
prisma/               # Database schema
tests/                # Multi-tier test suite
scripts/              # 30+ architecture guard scripts
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure. Here are the most important ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT signing. Generate: `openssl rand -base64 32` |
| `API_ENCRYPTION_KEY` | Yes | Encrypts stored API keys. Generate once, **never change after first user registers** |
| `STORAGE_TYPE` | No | `evolink` (default), `minio`, or `local` |
| `NEXTAUTH_URL` | For production | Your public URL (e.g. `https://yourdomain.com`) |

> **Important**: `API_ENCRYPTION_KEY` is used to encrypt all provider API keys in the database. If you change it after users have saved their keys, those keys become permanently unreadable. Generate a strong key once and keep it forever.

See `.env.example` for the full list with explanations.

---

## FAQ

### General

**Q: Do I need a GPU?**

A: No! All AI processing happens through cloud APIs (OpenAI, Google, etc.). Your server only needs to run the web app and coordinate tasks. A basic VPS or even a Raspberry Pi works.

**Q: How much does it cost to use?**

A: The platform itself is free and open-source. You pay for the AI API usage to providers like OpenAI, Google, etc. A typical 2-minute short drama costs roughly $1-5 in API fees depending on which models you choose.

### Installation

**Q: Docker says "port already in use"**

A: Another service is using the same port. Either stop that service, or edit `docker-compose.yml` to change the port mapping (e.g., `"23000:3000"` → `"8080:3000"`).

**Q: `docker compose up` hangs at building**

A: The first build takes 5-10 minutes — it's installing dependencies and compiling. Be patient. If it fails, check that Docker has enough memory allocated (at least 4GB recommended).

**Q: `npm install` fails with node-gyp errors**

A: Make sure you're using Node.js 18+. Run `node -v` to check. If you're on an older version, install [nvm](https://github.com/nvm-sh/nvm) and run `nvm use` in the project directory.

**Q: Database connection refused**

A: Make sure MySQL is running. For Docker: `docker compose up mysql -d`. For local: check that MySQL is started and the `DATABASE_URL` in `.env` matches your setup.

### Usage

**Q: Video generation is slow**

A: Video generation depends on the AI provider. Kling and Seedance typically take 1-3 minutes per shot. The platform processes shots in parallel, so a 20-shot episode might take 5-10 minutes total.

**Q: Images look inconsistent between shots**

A: This is a common challenge with AI-generated content. Tips:
- Use the Character Workshop to generate reference images first
- The platform uses these references to maintain consistency
- Generating 2-4 candidates per shot and picking the best one helps

**Q: Can I edit the generated storyboard?**

A: Yes! Every shot's description, camera angle, and prompt can be edited manually before generating images/videos. The AI gives you a starting point that you can refine.

**Q: What video formats are supported?**

A: The platform generates MP4 (H.264) by default. Each shot is a separate video that you can download individually or as a ZIP package.

### Deployment

**Q: How do I deploy to a cloud server?**

A: Clone the repo on your server and run Docker Compose:
```bash
git clone https://github.com/EvoLinkAI/ai-short-drama.git
cd ai-short-drama
# Edit docker-compose.yml → change NEXTAUTH_SECRET, API_ENCRYPTION_KEY, etc.
docker compose up -d
```
Then set up a reverse proxy (Nginx/Caddy) for HTTPS. See the [Quick Start](#quick-start) section for details.

**Q: How do I enable HTTPS?**

A: We include a Caddyfile. Install [Caddy](https://caddyserver.com), point your domain to the server, and run:
```bash
caddy run --config Caddyfile
```
Caddy auto-provisions TLS certificates.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- **Bug reports**: [Open an issue](https://github.com/EvoLinkAI/ai-short-drama/issues)
- **Feature requests**: [Open an issue](https://github.com/EvoLinkAI/ai-short-drama/issues)
- **Pull requests**: Fork → branch → PR

---

## About

**AIDrama Studio** is built and maintained by [EvoLinkAI](https://github.com/EvoLinkAI).

- Website: [aidrama.dev](https://aidrama.dev)
- AI Provider: [evolink.ai](https://evolink.ai)
- GitHub: [github.com/EvoLinkAI](https://github.com/EvoLinkAI)

---

## License

[MIT](LICENSE) — free for personal and commercial use.

---

<div align="center">

**If this project helps you, give it a star!**

[![Star History Chart](https://api.star-history.com/svg?repos=EvoLinkAI/ai-short-drama&type=Date)](https://star-history.com/#EvoLinkAI/ai-short-drama&Date)

Powered by [EvoLinkAI](https://evolink.ai)

</div>
