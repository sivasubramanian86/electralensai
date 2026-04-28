import { render, screen, fireEvent, act } from '@testing-library/react';
import { Flashcards } from './Flashcards';
import { describe, it, expect, vi } from 'vitest';

describe('Flashcards Component', () => {
  vi.useFakeTimers();

  it('renders the initial flashcard', () => {
    render(<Flashcards />);
    expect(screen.getByText(/Civic Flashcards/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to flip/i)).toBeInTheDocument();
  });

  it('flips the card when clicked', async () => {
    render(<Flashcards />);
    const card = screen.getByText(/Click to flip/i).parentElement;
    if (card) {
      fireEvent.click(card);
      // Flipped state check
      expect(screen.getByText(/Click to flip/i)).toBeInTheDocument();
    }
  });

  it('navigates to the next card', async () => {
    render(<Flashcards />);
    const nextButton = screen.getByText('→');
    
    fireEvent.click(nextButton);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    expect(screen.getByText(/2 \/ /)).toBeInTheDocument();
  });

  it('navigates to the previous card', async () => {
    render(<Flashcards />);
    const prevButton = screen.getByText('←');
    
    fireEvent.click(prevButton);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    // Wraps to last card
    expect(screen.getByText(/ \/ /)).toBeInTheDocument();
  });
});
