# Daily Run Tracker

React + Vite app for logging runs and period-cycle notes. Sign in to save both sets of data to a private Supabase account and sync between devices.

## Set up cloud storage

1. Create a project at [Supabase](https://supabase.com/).
2. In the Supabase SQL Editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql). The table uses row-level security so signed-in users can access only their own record.
3. In Supabase **Authentication > URL Configuration**, set the Site URL to your deployed website URL. Add `http://localhost:3000` and your deployed URL to the allowed redirect URLs.
4. Copy `.env.example` to `.env.local`. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project's API settings. The browser key may be public; **never use a service-role key in this app or expose it in a `VITE_` variable**.
5. Install and run the app:

   ```sh
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`, create an account, then sign in. On the first sign-in, existing run and cycle data in this browser is copied to the cloud if that account has no saved record yet.

## Deploy to the web

One straightforward option is Vercel:

1. Push this project to a GitHub repository.
2. Import the repository in Vercel. It detects Vite; use `npm run build` as the build command and `dist` as the output directory.
3. In the Vercel project's **Settings > Environment Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values as your local environment.
4. Deploy, then add the Vercel URL to Supabase's allowed redirect URLs and set it as the Site URL.
5. Redeploy after changing environment variables. Vite embeds them during the build.

Other static hosts that can build a Vite app can be used similarly: build with `npm run build` and publish `dist`.

## Data and privacy

Run entries, period entries, and cycle settings are stored together in a row owned by the signed-in Supabase user. Saves happen automatically, and the footer reports cloud sync status. Individual entries can be deleted in the app; deleting an account also removes its row through the database foreign-key cascade.

Cloud storage is more durable than browser-only storage and works across devices, but no hosted service can promise data will exist forever: availability, backups, retention, and account deletion are subject to Supabase's policies and your project status. Keep independent backups of anything important. Period and health-related notes are sensitive; choose a trusted host, protect the account with a strong unique password, and do not share the service-role key.

## Local checks

```sh
npm run lint
npm run build
```
