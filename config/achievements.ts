import React from 'react';
import {
  Star, Trophy, Crown, Zap, Sparkles, CheckCircle2, Clock,
  Target, Flame, Coins, Palette, Grid, Award, Medal, Gem,
  Rocket, Infinity, Timer, TrendingUp, Layers, Gift
} from 'lucide-react';

/**
 * Achievement interface for game achievements
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  reward: number;
}

/**
 * Game achievements configuration
 * Add new achievements here to make them available in the game
 * 
 * To add a new achievement:
 * 1. Add an entry to the ACHIEVEMENTS array below
 * 2. Add the unlock logic in stores/achievement-store.ts checkAchievements function
 */
export const ACHIEVEMENTS: Achievement[] = [
  // First Steps
  { id: 'first_clear', name: 'First Flow', description: 'Complete your first level', icon: Star, reward: 50 },
  { id: 'levels_10', name: 'Getting Started', description: 'Complete 10 levels', icon: CheckCircle2, reward: 100 },
  { id: 'levels_25', name: 'Quarter Century', description: 'Complete 25 levels', icon: Target, reward: 150 },
  { id: 'levels_50', name: 'Half Century', description: 'Complete 50 levels', icon: Medal, reward: 250 },
  { id: 'levels_100', name: 'Centurion', description: 'Complete 100 levels', icon: Trophy, reward: 400 },
  { id: 'levels_250', name: 'Quarter Millennium', description: 'Complete 250 levels', icon: Award, reward: 750 },
  { id: 'levels_500', name: 'Legend', description: 'Complete 500 levels', icon: Crown, reward: 1500 },
  { id: 'levels_1000', name: 'Master Flow', description: 'Complete 1000 levels', icon: Infinity, reward: 3000 },

  // Campaign Progression
  { id: 'campaign_10', name: 'Campaign Novice', description: 'Complete 10 campaign levels', icon: Layers, reward: 100 },
  { id: 'campaign_50', name: 'Campaign Veteran', description: 'Complete 50 campaign levels', icon: Grid, reward: 300 },
  { id: 'campaign_100', name: 'Campaign Master', description: 'Complete 100 campaign levels', icon: Rocket, reward: 600 },
  { id: 'stage_5', name: 'Stage Explorer', description: 'Reach stage 5', icon: TrendingUp, reward: 200 },
  { id: 'stage_10', name: 'Stage Veteran', description: 'Reach stage 10', icon: Award, reward: 400 },
  { id: 'stage_15', name: 'Stage Master', description: 'Reach stage 15', icon: Crown, reward: 800 },
  { id: 'stage_20', name: 'Stage Legend', description: 'Reach stage 20', icon: Gem, reward: 1500 },
  { id: 'stage_25', name: 'Ultimate Flow', description: 'Complete all 25 stages', icon: Infinity, reward: 3000 },

  // Perfect Clears
  { id: 'perfect_1', name: 'Perfect Start', description: 'Get your first perfect clear', icon: Star, reward: 100 },
  { id: 'perfect_5', name: 'Perfect Five', description: 'Get 5 perfect clears', icon: Medal, reward: 150 },
  { id: 'perfect_10', name: 'Perfect Decade', description: 'Get 10 perfect clears', icon: Trophy, reward: 200 },
  { id: 'perfect_25', name: 'Perfect Quarter', description: 'Get 25 perfect clears', icon: Award, reward: 400 },
  { id: 'perfect_50', name: 'Perfect Master', description: 'Get 50 perfect clears', icon: Crown, reward: 500 },
  { id: 'perfect_100', name: 'Perfect Centurion', description: 'Get 100 perfect clears', icon: Gem, reward: 1000 },
  { id: 'perfect_250', name: 'Perfect Legend', description: 'Get 250 perfect clears', icon: Infinity, reward: 2500 },

  // Daily Challenge Streaks
  { id: 'streak_3', name: 'Three Day Flow', description: '3 day daily challenge streak', icon: Flame, reward: 100 },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day daily challenge streak', icon: Zap, reward: 300 },
  { id: 'streak_14', name: 'Fortnight Fighter', description: '14 day daily challenge streak', icon: Sparkles, reward: 600 },
  { id: 'streak_30', name: 'Monthly Master', description: '30 day daily challenge streak', icon: Crown, reward: 1000 },
  { id: 'streak_60', name: 'Two Month Titan', description: '60 day daily challenge streak', icon: Gem, reward: 2000 },
  { id: 'streak_100', name: 'Century Streak', description: '100 day daily challenge streak', icon: Infinity, reward: 5000 },

  // Time Attack
  { id: 'time_attack_1', name: 'Speed Starter', description: 'Complete 1 time attack puzzle', icon: Clock, reward: 50 },
  { id: 'time_attack_5', name: 'Speed Runner', description: 'Complete 5 time attack puzzles', icon: Timer, reward: 150 },
  { id: 'time_attack_10', name: 'Speed Demon', description: 'Complete 10 time attack puzzles', icon: Zap, reward: 250 },
  { id: 'time_attack_25', name: 'Speed Master', description: 'Complete 25 time attack puzzles', icon: Rocket, reward: 500 },
  { id: 'time_attack_50', name: 'Speed Legend', description: 'Complete 50 time attack puzzles', icon: Infinity, reward: 1000 },
  { id: 'time_attack_high_5', name: 'Time Attack Ace', description: 'Score 5+ in any time attack mode', icon: Target, reward: 100 },
  { id: 'time_attack_high_10', name: 'Time Attack Pro', description: 'Score 10+ in any time attack mode', icon: Award, reward: 250 },
  { id: 'time_attack_high_20', name: 'Time Attack Master', description: 'Score 20+ in any time attack mode', icon: Crown, reward: 500 },

  // Currency & Economy
  { id: 'flows_100', name: 'First Fortune', description: 'Earn 100 flows', icon: Coins, reward: 50 },
  { id: 'flows_500', name: 'Flow Collector', description: 'Earn 500 flows', icon: Gift, reward: 100 },
  { id: 'flows_1000', name: 'Flow Accumulator', description: 'Earn 1000 flows', icon: Coins, reward: 200 },
  { id: 'flows_5000', name: 'Flow Millionaire', description: 'Earn 5000 flows', icon: Gem, reward: 500 },
  { id: 'flows_10000', name: 'Flow Master', description: 'Earn 10000 flows', icon: Crown, reward: 1000 },
  { id: 'unlock_theme_1', name: 'Theme Collector', description: 'Unlock your first theme', icon: Palette, reward: 100 },
  { id: 'unlock_theme_all', name: 'Theme Master', description: 'Unlock all themes', icon: Sparkles, reward: 500 },

  // Time Played
  { id: 'time_1h', name: 'Hour of Flow', description: 'Play for 1 hour', icon: Clock, reward: 100 },
  { id: 'time_5h', name: 'Five Hour Flow', description: 'Play for 5 hours', icon: Timer, reward: 300 },
  { id: 'time_10h', name: 'Ten Hour Master', description: 'Play for 10 hours', icon: Award, reward: 600 },
  { id: 'time_24h', name: 'Day of Flow', description: 'Play for 24 hours', icon: Crown, reward: 1500 },
  { id: 'time_100h', name: 'Century Hours', description: 'Play for 100 hours', icon: Infinity, reward: 5000 },
];
