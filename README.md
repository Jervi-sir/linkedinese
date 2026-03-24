# Linkedinese

Linkedinese is a Next.js project designed to simulate and connect with ChatGPT, inspired by tools like **opencode cli** and **kilo cli**. It aims to provide a robust interface for seamless interaction with OpenAI's language models.

## The Challenge: Authentication & Whitelisting

Currently, the project faces a significant hurdle concerning the **Codex authentication** flow.

### The Problem
OpenAI's whitelist for this specific Codex auth flow appears to be strictly restricted to `localhost`, and specifically requires **port 1455**.

- **Works Perfect Locally**: When running on `localhost:1455`, the authentication callback works as intended.
- **Fails in Production**: On platforms like **Vercel** or a standard **VPS**, the callback authentication is tied to a public IP or a different domain. Since OpenAI's current whitelist is restricted to `localhost`, the callback is rejected, breaking the authentication flow and halting progress in production environments.

### Potential Fixes
We are currently exploring ways to circumvent or resolve this restriction so the application can be fully functional in deployed environments. If you have insights or a potential fix for this whitelisting issue, your contributions are welcome.

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Hugeicons, Lucide React

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:1455](http://localhost:1455) (ensure your environment is set to this port for auth compatibility) to see the result.

## Development

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
