This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Set up your API key (one-time)

This app calls the real Anthropic AI to research and generate vocal chains. To use the real thing rather than the built-in offline practice mode:

1. Copy `.env.example` to a new file called `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Get a key at [console.anthropic.com](https://console.anthropic.com/) and paste it in as `ANTHROPIC_API_KEY=your-real-key-here`.
3. Restart the dev server if it's already running.

`.env.local` is already excluded from git (see `.gitignore`) — your real key is never committed or pushed anywhere. If you skip this step entirely, the app automatically falls back to a fast, free, offline practice mode instead of failing.

### Run the app

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
