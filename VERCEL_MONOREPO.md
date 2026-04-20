# Vercel Monorepo Setup

Use a dedicated Vercel project for the frontend app in `apps/explorer-web`.

## Required Dashboard Changes

1. Open the existing frontend project in Vercel.
2. Go to `Settings -> General`.
3. Set `Root Directory` to `apps/explorer-web`.
4. Keep `Framework Preset` as `Next.js`.
5. Keep `Output Directory` empty.
6. Keep the install command on auto-detect unless you need to pin it.
7. If you customize commands, use:
   - `Install Command`: `bun install`
   - `Build Command`: `bun run build`

## Environment Variables

Move nothing unless the app currently reads variables from Vercel. The environment variables should remain attached to the same Vercel project; changing the root directory does not delete them.

## Optional Separate Project For Docs

If you want docs deployed independently:

1. Create a second Vercel project.
2. Point it at the same repository.
3. Set `Root Directory` to `apps/docs`.
4. Use the Astro preset if Vercel detects it automatically.

## Why This Matters

Once `apps/explorer-web` is the root directory, deploys stop depending on the repository root layout. That means reorganizing `services/` and `apps/docs/` will not break the frontend build as long as `apps/explorer-web` remains internally consistent.
