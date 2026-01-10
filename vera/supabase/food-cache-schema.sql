-- Supabase SQL: Create food_cache table
-- Smart Saver: Cache AI analysis results to reduce API costs
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS food_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Hash for quick lookup (MD5 of normalized text or image hash)
  query_hash TEXT UNIQUE NOT NULL,
  
  -- Original query info
  query_type TEXT CHECK (query_type IN ('text', 'image', 'combined')) NOT NULL,
  query_text TEXT, -- Normalized food name/description
  
  -- Cached AI response
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  fiber INTEGER DEFAULT 0,
  portion_size TEXT,
  portion_grams INTEGER,
  health_score TEXT CHECK (health_score IN ('excellent', 'good', 'moderate', 'indulgent')),
  health_tip TEXT,
  cooking_method TEXT,
  cuisine_type TEXT,
  
  -- Metadata
  ai_provider TEXT, -- 'groq' or 'gemini'
  hit_count INTEGER DEFAULT 1, -- Track popularity
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast hash lookups
CREATE INDEX IF NOT EXISTS food_cache_hash_idx ON food_cache(query_hash);

-- Index for text search (partial matches)
CREATE INDEX IF NOT EXISTS food_cache_text_idx ON food_cache USING gin(to_tsvector('english', query_text));

-- Enable RLS (public read for cached data, no auth needed)
ALTER TABLE food_cache ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read cache)
CREATE POLICY "Public can read food cache"
  ON food_cache FOR SELECT
  USING (true);

-- Only server can insert/update (via service role key)
-- For now, allow authenticated users to insert
CREATE POLICY "Authenticated users can insert cache"
  ON food_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cache"
  ON food_cache FOR UPDATE
  USING (true);
