-- Supabase SQL: Create food_logs table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Log details
  meal_name TEXT NOT NULL, -- "Rajma Chawal", "Banana", etc.
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  -- Media
  image_path TEXT, -- Storage path
  audio_path TEXT, -- Storage path
  note TEXT, -- Transcribed text or user notes
  
  -- Nutrition Data (Calculated by AI)
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0, -- in grams
  carbs INTEGER DEFAULT 0, -- in grams
  fats INTEGER DEFAULT 0, -- in grams
  fiber INTEGER DEFAULT 0, -- in grams
  
  -- Meta
  is_ai_processed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Can be backdated
);

-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own logs"
  ON food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON food_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON food_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for querying logs by date
CREATE INDEX IF NOT EXISTS food_logs_user_date_idx ON food_logs(user_id, logged_at);
