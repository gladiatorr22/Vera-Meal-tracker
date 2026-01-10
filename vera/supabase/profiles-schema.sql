-- Supabase SQL: Enhanced profiles table
-- Run this in your Supabase SQL Editor

-- Drop and recreate if you want a fresh start (CAREFUL: deletes data)
-- DROP TABLE IF EXISTS profiles;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- User physical data
  age INTEGER,
  height NUMERIC(5,2), -- in cm
  weight NUMERIC(5,2), -- in kg
  gender TEXT CHECK (gender IN ('male', 'female')),
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal TEXT CHECK (goal IN ('cut', 'bulk', 'maintain')),
  
  -- Diet preferences
  diet_type TEXT CHECK (diet_type IN ('vegetarian', 'non_vegetarian', 'eggetarian', 'vegan')),
  gym_frequency INTEGER DEFAULT 0 CHECK (gym_frequency >= 0 AND gym_frequency <= 7),
  allergies TEXT[] DEFAULT '{}',
  preferred_cuisine TEXT DEFAULT 'mixed' CHECK (preferred_cuisine IN ('north_indian', 'south_indian', 'gujarati', 'bengali', 'maharashtrian', 'mixed')),
  
  -- Calculated targets
  bmr INTEGER,
  tdee INTEGER,
  target_calories INTEGER,
  target_protein INTEGER,
  target_carbs INTEGER,
  target_fat INTEGER,
  target_fiber INTEGER DEFAULT 25,
  target_water NUMERIC(3,1) DEFAULT 2.5,
  
  -- Katori calibration
  katori_size TEXT DEFAULT 'medium' CHECK (katori_size IN ('small', 'medium', 'large')),
  
  -- Status
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
