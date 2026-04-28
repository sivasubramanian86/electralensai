/**
 * GamificationBar — Sidebar gamification widget.
 * Shows XP progress, level, streak, and recent badges.
 */

import { Flame, Star, Trophy, Zap } from 'lucide-react';
import type { UseGamificationResult } from '../../hooks/useGamification';

interface GamificationBarProps {
  gamification: UseGamificationResult;
}

export function GamificationBar({ gamification }: GamificationBarProps) {
  const { xp, level, xpPercent, xpToNextLevel, streak, levelTitle, badges } = gamification;
  const unlockedBadges = badges.filter((b) => b.unlocked);

  return (
    <div className="px-4 py-4 border-t border-white/5 space-y-4">
      {/* Level & XP */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {levelTitle}
            </span>
          </div>
          <span className="text-[10px] font-mono text-blue-400">
            Lv.{level}
          </span>
        </div>

        {/* XP Bar */}
        <div 
          className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={xpPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`XP progress: ${xpPercent}% towards level ${level + 1}`}
        >
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${xpPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono text-slate-500">{xp} XP</span>
          <span className="text-[9px] font-mono text-slate-600">
            {xpToNextLevel} XP next
          </span>
        </div>
      </div>

      {/* Streak & Stats Row */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[10px] font-bold text-orange-400">{streak}d</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Star className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-bold text-amber-400">
            {unlockedBadges.length} Badges
          </span>
        </div>
        {unlockedBadges.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Trophy className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-bold text-violet-400">
              {xp} XP
            </span>
          </div>
        )}
      </div>

      {/* Recent Badges */}
      {unlockedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unlockedBadges.slice(-4).map((badge) => (
            <div
              key={badge.id}
              title={`${badge.label}: ${badge.desc}`}
              className="text-base cursor-help transition-transform hover:scale-125"
            >
              {badge.icon}
            </div>
          ))}
          {unlockedBadges.length > 4 && (
            <span className="text-[9px] text-slate-500 self-center">
              +{unlockedBadges.length - 4} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
