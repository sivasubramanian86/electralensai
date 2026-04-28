import { render, screen } from '@testing-library/react';
import { GamificationBar } from './GamificationBar';
import { describe, it, expect } from 'vitest';

const mockGamification = {
  xp: 1500,
  level: 5,
  xpPercent: 50,
  xpToNextLevel: 200,
  streak: 7,
  levelTitle: 'Democracy Champion',
  badges: [
    { id: '1', label: 'First Vote', desc: 'Cast your first vote', icon: '🗳️', unlocked: true, xpReward: 100 },
    { id: '2', label: 'Fact Checker', desc: 'Debunked a myth', icon: '🔍', unlocked: true, xpReward: 100 },
    { id: '3', label: 'Timeline Hero', desc: 'Explored all phases', icon: '⏳', unlocked: false, xpReward: 100 },
  ],
  addXp: () => {},
  unlockBadge: () => {},
  awardXP: () => {},
  completeChapter: () => {},
  recordQuizAnswer: () => {},
  lastVisitDate: '',
  chaptersCompleted: [],
  completedChapters: [],
  quizScores: {},
  consecutiveDays: 7,
  totalQuizCorrect: 0,
  totalQuizAnswered: 0,
};

describe('GamificationBar Component', () => {
  it('renders progress and stats correctly', () => {
    render(<GamificationBar gamification={mockGamification} />);
    expect(screen.getByText('Democracy Champion')).toBeInTheDocument();
    expect(screen.getByText('Lv.5')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
  });

  it('shows unlocked badges and total count', () => {
    render(<GamificationBar gamification={mockGamification} />);
    expect(screen.getByText('2 Badges')).toBeInTheDocument();
    expect(screen.getByText('🗳️')).toBeInTheDocument();
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('handles empty badges state', () => {
    const emptyGami = { ...mockGamification, badges: [] };
    render(<GamificationBar gamification={emptyGami} />);
    expect(screen.getByText('0 Badges')).toBeInTheDocument();
  });

  it('shows "more" indicator when many badges are unlocked', () => {
    const manyBadges = Array.from({ length: 6 }, (_, i) => ({
      id: `${i}`,
      label: `Badge ${i}`,
      desc: '',
      icon: '🎖️',
      unlocked: true,
      xpReward: 100,
    }));
    const fullGami = { ...mockGamification, badges: manyBadges };
    render(<GamificationBar gamification={fullGami} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });
});
