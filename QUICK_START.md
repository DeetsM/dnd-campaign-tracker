# Quick Start: Vercel Supabase Integration

You've already connected Supabase via Vercel's marketplace! Here's what you need to do:

## 1. Pull Environment Variables ✅ (Already Done)

```bash
vercel env pull .env.development.local
```

This created your `.env.development.local` file with all necessary credentials.

## 2. Create Database Table

Go to [your Supabase dashboard](https://supabase.com/dashboard) and:

1. Select your project
2. Go to **SQL Editor** → **New Query**
3. Paste and execute this SQL:

```sql
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

CREATE INDEX idx_combat_history_date ON combat_history(date DESC);

ALTER TABLE combat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON combat_history
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 3. Test It!

```bash
npm run dev
```

- Open http://localhost:5173
- Create a combat session and end it
- Check your Supabase dashboard → **combat_history** table
- Your data should be there! 🎉

## 4. Deploy to Vercel

```bash
git push origin main
```

Vercel will automatically use the environment variables you configured through the marketplace integration.

## Done!

Your D&D Combat Tracker now has persistent cloud storage. All your combat sessions are saved and accessible across devices!
