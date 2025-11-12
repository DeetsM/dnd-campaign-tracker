# Persistent Storage Setup Guide

This guide covers two ways to set up persistent cloud storage for your D&D Combat Tracker using Supabase:
1. **Vercel Marketplace** (Recommended - easiest)
2. **Manual Setup** (if not using Vercel)

## Option 1: Vercel Marketplace Integration (Recommended)

If you've already connected Supabase via Vercel's marketplace, follow these steps:

### Step 1: Pull Environment Variables

In your project directory, run:

```bash
vercel env pull .env.development.local
```

This will:
- Authenticate with Vercel (if not already logged in)
- Link your project (if not already linked)
- Download all environment variables to `.env.development.local`
- Automatically set up the Supabase connection

✅ **Done!** The environment variables are now configured for local development.

### Step 2: Create the Database Table

You still need to create the `combat_history` table in Supabase:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy and paste the SQL below and execute it:

```sql
-- Create combat_history table
CREATE TABLE combat_history (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  combatants JSONB NOT NULL,
  log_entries JSONB NOT NULL,
  rounds INTEGER NOT NULL,
  stats JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX idx_combat_history_date ON combat_history(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE combat_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read/write (for development)
-- WARNING: In production, implement proper authentication
CREATE POLICY "Allow all operations" ON combat_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

5. You should see "Success" message

### Step 3: Environment Variables are Already Set!

The `.env.development.local` file created by `vercel env pull` contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The app automatically uses these variables, so no additional configuration needed!

### Step 4: Test Locally

1. Start your dev server: `npm run dev`
2. Open http://localhost:5173
3. Create and end a combat session
4. Check your Supabase dashboard → **combat_history** table
5. Your combat should appear there!

---

## Option 2: Manual Setup (Without Vercel)

## Important Notes

⚠️ **Security Considerations**:
- The current RLS policy (`Allow all operations`) permits anyone with your Supabase URL and Anon Key to access your combat data
- For production use with sensitive data, implement proper authentication:
  - User authentication (Google, GitHub, or custom)
  - Row-level security policies that restrict access to the user's own data
  - See [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

✅ **Features Included**:
- Automatic sync to cloud when combat ends
- Data persists across devices and browsers
- Combat history loads automatically on app startup
- Title editing updates the database
- Fallback to localStorage for real-time combat data (doesn't sync until combat ends)

📊 **Free Tier Limits** (Supabase):
- 500 MB database storage
- Unlimited API requests
- Perfect for personal use!

---

## Option 2: Manual Setup (Without Vercel)

If you're not using Vercel's Supabase integration, follow these steps:

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: dnd-campaign-tracker (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to you
4. Wait for the project to initialize (2-3 minutes)

### Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor** → **New Query**
2. Copy the SQL from Option 1, Step 2 above
3. Execute it and verify you see "Success"

### Step 3: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **Anon Key** (public anonymous key)

### Step 4: Configure Environment Variables for Local Development

1. Create a `.env.local` file in your project root
2. Add:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Restart your dev server (`npm run dev`)

### Step 5: Configure Environment Variables for Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add two new variables:
   - **Name**: `VITE_SUPABASE_URL` | **Value**: Your Supabase URL
   - **Name**: `VITE_SUPABASE_ANON_KEY` | **Value**: Your Supabase Anon Key
4. Ensure they're available for Production, Preview, and Development
5. Redeploy your application

### Step 6: Test the Connection

1. Start your app locally (`npm run dev`) or visit your Vercel deployment
2. Create and end a combat session
3. Check your Supabase dashboard:
   - Go to **SQL Editor** → **combat_history** table
   - Your combat session should appear

## Troubleshooting

**"Cannot convert undefined or null to object" error**:
- Check that your environment variables are set correctly
- Make sure you created the `combat_history` table with the SQL above

**Data not persisting**:
- Check browser console for errors (F12 → Console tab)
- Verify Supabase credentials are correct
- Make sure the table was created successfully

**Can't connect to Supabase**:
- Double-check the Project URL format (should be `https://xxx.supabase.co`)
- Verify the Anon Key is copied completely
- Check your internet connection

## Next Steps (Optional)

1. **Add Authentication**: Implement user login so each user has their own combat data
2. **Backup Strategy**: Regular backups of your Supabase database
3. **Real-time Sync**: Use Supabase's real-time features for live updates across devices
4. **Migrate Existing Data**: If you have local storage data, you can manually export and import it
