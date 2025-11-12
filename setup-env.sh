#!/bin/bash
# This script maps Vercel's NEXT_PUBLIC_* environment variables to VITE_* format
# Run this before building in production

# Create temporary .env file for build
cat > .env.production.local << EOF
# Auto-generated from Vercel environment variables
VITE_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
EOF

echo "✅ Environment variables mapped for Vite build"
