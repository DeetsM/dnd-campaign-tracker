# Vercel Environment Variables Setup

Since you connected Supabase via Vercel's marketplace, the environment variables should already be configured. However, make sure they're set up correctly in Vercel for production deployments.

## Check Your Vercel Environment Variables

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your **dnd-campaign-tracker** project
3. Go to **Settings** → **Environment Variables**

## Expected Variables

You should see these variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Other Supabase/Postgres variables

## Important: Variable Availability

Make sure each variable is available for:
- ✅ Production
- ✅ Preview
- ✅ Development

If you set them up via the marketplace integration, they should already be set to all three environments.

## How It Works

1. **Local development** (`.env.development.local`):
   - Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Automatically loaded by Vite

2. **Production build**:
   - Vercel injects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `vite.config.ts` automatically maps these to `VITE_*` format at build time
   - The final built app has the correct values embedded

## If Variables Are Missing

If you don't see the variables in Vercel:

1. Go to your Vercel project
2. Click **Settings** → **Integrations**
3. Find **Supabase** integration
4. Click it and authenticate/reconnect if needed
5. The marketplace should re-configure your environment variables

## Testing Production Build Locally

To test that your production build will work on Vercel:

```bash
npm run build
npm run preview
```

Visit http://localhost:4173 and try creating a combat session. If it syncs to Supabase, your production deployment will work!

## Deployment

Simply push to your repository:

```bash
git add .
git commit -m "Fix environment variables for Supabase"
git push origin main
```

Vercel will automatically:
1. Pull the latest code
2. Install dependencies
3. Use `npm run build` (which now handles both Vite and Vercel env formats)
4. Deploy the built app

Done! 🚀
