import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { describe, it, expect, vi } from 'vitest';

// Global mocks for lucide-react and react-i18next are in setup.tsx

// Mock LoginButton
vi.mock('../auth/LoginButton', () => ({
  LoginButton: () => <div data-testid="login-btn" />
}));

describe('Sidebar Component', () => {
  const mockGamification = {
    xp: 100,
    level: 2,
    xpPercent: 40,
    xpToNextLevel: 150,
    streak: 5,
    levelTitle: 'Civic Explorer',
    completedChapters: [],
    badges: [],
    totalQuizCorrect: 0,
    totalQuizAnswered: 0,
    lastVisitDate: '2026-04-25',
    awardXP: vi.fn(),
    completeChapter: vi.fn(),
    recordQuizAnswer: vi.fn(),
    unlockBadge: vi.fn(),
  };

  it('calls onTabChange when a menu item is clicked', () => {
    const mockOnTabChange = vi.fn();
    render(
      <Sidebar 
        activeTab="dashboard" 
        onTabChange={mockOnTabChange} 
        gamification={mockGamification as any} 
      />
    );
    
    const timelineBtn = screen.getByText(/Election Journey/i);
    fireEvent.click(timelineBtn);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('timeline');
  });
});
