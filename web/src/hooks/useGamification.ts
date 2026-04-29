/**
 * ElectraLensAI — Gamification engine.
 *
 * Manages XP, levels, badges, streaks, and completed chapters
 * with localStorage persistence. Non-partisan, purely educational.
 */

import { useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Badge {
  id: string;
  label: string;
  icon: string;
  desc: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  xpToNextLevel: number;
  streak: number;
  lastVisitDate: string;
  completedChapters: string[];
  badges: Badge[];
  totalQuizCorrect: number;
  totalQuizAnswered: number;
}

export interface UseGamificationResult extends GamificationState {
  awardXP: (amount: number) => void;
  completeChapter: (chapterId: string) => void;
  recordQuizAnswer: (correct: boolean) => void;
  unlockBadge: (badgeId: string) => void;
  xpPercent: number;
  levelTitle: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'electralens_gamification_v1';

const XP_PER_LEVEL = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 6000, 10000];

const LEVEL_TITLES = [
  'Civic Newcomer',
  'Ballot Beginner',
  'Voter Aware',
  'Democracy Apprentice',
  'Constituency Scout',
  'Election Insider',
  'Constitution Reader',
  'Democracy Champion',
  'Civic Luminary',
  'ElectraLens Master',
];

const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    label: 'First Step',
    icon: '👣',
    desc: 'Opened the ElectraLensAI dashboard for the first time.',
    xpReward: 10,
    unlocked: false,
  },
  {
    id: 'voter_registration_pro',
    label: 'Voter Registration Pro',
    icon: '📋',
    desc: 'Completed the Voter Readiness Guide chapter.',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'timeline_explorer',
    label: 'Timeline Explorer',
    icon: '🗓️',
    desc: 'Explored all 5 election phases in the Journey Storyboard.',
    xpReward: 75,
    unlocked: false,
  },
  {
    id: 'myth_buster',
    label: 'Myth-Buster',
    icon: '🛡️',
    desc: 'Fact-checked 3 or more viral election claims.',
    xpReward: 60,
    unlocked: false,
  },
  {
    id: 'counting_room_insider',
    label: 'Counting Room Insider',
    icon: '🔢',
    desc: 'Completed the Vote Counting simulation module.',
    xpReward: 80,
    unlocked: false,
  },
  {
    id: 'constitution_explorer',
    label: 'Constitution Explorer',
    icon: '📜',
    desc: 'Read 5 or more constitutional articles in the Knowledge Hub.',
    xpReward: 100,
    unlocked: false,
  },
  {
    id: 'data_detective',
    label: 'Data Detective',
    icon: '📊',
    desc: 'Explored electoral data charts in the Data Explorer.',
    xpReward: 60,
    unlocked: false,
  },
  {
    id: 'streak_3',
    label: '3-Day Streak',
    icon: '🔥',
    desc: 'Visited ElectraLensAI for 3 consecutive days.',
    xpReward: 90,
    unlocked: false,
  },
  {
    id: 'quiz_ace',
    label: 'Quiz Ace',
    icon: '🎯',
    desc: 'Answered 10 quiz questions correctly.',
    xpReward: 120,
    unlocked: false,
  },
  {
    id: 'commissioner_sim',
    label: 'Commissioner Simulator',
    icon: '⚖️',
    desc: 'Completed the Election Commissioner Role-Play scenario.',
    xpReward: 150,
    unlocked: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeLevel(xp: number): { level: number; xpToNextLevel: number } {
  let level = 0;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (xp >= XP_PER_LEVEL[i]) {
      level = i;
    } else {
      break;
    }
  }
  const nextThreshold = XP_PER_LEVEL[Math.min(level + 1, XP_PER_LEVEL.length - 1)];
  return { level, xpToNextLevel: nextThreshold };
}

function todayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

function loadState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GamificationState;
  } catch {
    // Corrupt storage — reset
  }
  const initial: GamificationState = {
    xp: 0,
    level: 0,
    xpToNextLevel: XP_PER_LEVEL[1],
    streak: 1,
    lastVisitDate: todayDateStr(),
    completedChapters: [],
    badges: INITIAL_BADGES,
    totalQuizCorrect: 0,
    totalQuizAnswered: 0,
  };
  return initial;
}

function saveState(state: GamificationState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGamification(): UseGamificationResult {
  const [state, setState] = useState<GamificationState>(() => {
    const loaded = loadState();
    // Streak logic
    const today = todayDateStr();
    const last = loaded.lastVisitDate;
    const diffDays =
      (new Date(today).getTime() - new Date(last).getTime()) / 86_400_000;
    let streak = loaded.streak;
    if (diffDays === 1) {
      streak = (loaded.streak || 0) + 1;
    } else if (diffDays > 1) {
      streak = 1;
    }

    let finalState = { ...loaded, streak, lastVisitDate: today };

    // Award "First Step" badge if not already unlocked
    const hasFirst = finalState.badges.find((b) => b.id === 'first_step');
    if (hasFirst && !hasFirst.unlocked) {
      const newBadges = finalState.badges.map((b) =>
        b.id === 'first_step'
          ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
          : b,
      );
      const newXP = finalState.xp + hasFirst.xpReward;
      const { level, xpToNextLevel } = computeLevel(newXP);
      finalState = { ...finalState, badges: newBadges, xp: newXP, level, xpToNextLevel };
    }

    // Streak badge
    if (finalState.streak >= 3) {
      const hasStreak3 = finalState.badges.find((b) => b.id === 'streak_3');
      if (hasStreak3 && !hasStreak3.unlocked) {
        const newBadges = finalState.badges.map((b) =>
          b.id === 'streak_3'
            ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
            : b,
        );
        const newXP = finalState.xp + hasStreak3.xpReward;
        const { level, xpToNextLevel } = computeLevel(newXP);
        finalState = { ...finalState, badges: newBadges, xp: newXP, level, xpToNextLevel };
      }
    }

    return finalState;
  });

  // Persist on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const awardXP = useCallback((amount: number) => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const { level, xpToNextLevel } = computeLevel(newXP);
      return { ...prev, xp: newXP, level, xpToNextLevel };
    });
  }, []);

  const completeChapter = useCallback(
    (chapterId: string) => {
      setState((prev) => {
        if (prev.completedChapters.includes(chapterId)) return prev;
        const newChapters = [...prev.completedChapters, chapterId];
        const newXP = prev.xp + 30;
        const { level, xpToNextLevel } = computeLevel(newXP);
        return {
          ...prev,
          xp: newXP,
          level,
          xpToNextLevel,
          completedChapters: newChapters,
        };
      });
    },
    [],
  );

  const recordQuizAnswer = useCallback((correct: boolean) => {
    setState((prev) => {
      const totalQuizAnswered = prev.totalQuizAnswered + 1;
      const totalQuizCorrect = prev.totalQuizCorrect + (correct ? 1 : 0);
      const xpGain = correct ? 20 : 5;
      const newXP = prev.xp + xpGain;
      const { level, xpToNextLevel } = computeLevel(newXP);
      return {
        ...prev,
        xp: newXP,
        level,
        xpToNextLevel,
        totalQuizCorrect,
        totalQuizAnswered,
      };
    });
  }, []);

  const unlockBadge = useCallback((badgeId: string) => {
    setState((prev) => {
      const badge = prev.badges.find((b) => b.id === badgeId);
      if (!badge || badge.unlocked) return prev;
      const newBadges = prev.badges.map((b) =>
        b.id === badgeId
          ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
          : b,
      );
      const newXP = prev.xp + badge.xpReward;
      const { level, xpToNextLevel } = computeLevel(newXP);
      return { ...prev, badges: newBadges, xp: newXP, level, xpToNextLevel };
    });
  }, []);

  const currentThreshold = XP_PER_LEVEL[Math.max(0, state.level)];
  const xpInLevel = state.xp - currentThreshold;
  const xpRangeForLevel = state.xpToNextLevel - currentThreshold;
  const xpPercent = Math.min(100, Math.round((xpInLevel / Math.max(1, xpRangeForLevel)) * 100));

  return {
    ...state,
    awardXP,
    completeChapter,
    recordQuizAnswer,
    unlockBadge,
    xpPercent,
    levelTitle: LEVEL_TITLES[Math.min(state.level, LEVEL_TITLES.length - 1)],
  };
}
