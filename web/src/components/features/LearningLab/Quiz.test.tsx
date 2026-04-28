import { render, screen, fireEvent } from '@testing-library/react';
import { Quiz } from './Quiz';
import { describe, it, expect } from 'vitest';
import { CIVIC_MOCKS } from '../../../mocks/civicKnowledge';

describe('Quiz Component', () => {
  it('renders the first question', () => {
    render(<Quiz />);
    expect(screen.getByText(/Civic Quiz/i)).toBeInTheDocument();
  });

  it('allows selecting an answer and shows explanation', async () => {
    render(<Quiz />);
    const option = screen.getAllByRole('radio')[0];
    fireEvent.click(option);
    
    expect(screen.getByText(/Why this is correct/i)).toBeInTheDocument();
  });

  it('completes the quiz and allows restart', async () => {
    render(<Quiz />);
    
    const questionsCount = CIVIC_MOCKS.quiz.length;
    for (let i = 0; i < questionsCount; i++) {
        const currentQ = CIVIC_MOCKS.quiz[i];
        const options = screen.getAllByRole('radio');
        // Select the correct option for score increment
        fireEvent.click(options[currentQ.correct]);
        const nextBtn = screen.getByText(/Next Question|Finish Quiz/i);
        fireEvent.click(nextBtn);
    }

    expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${questionsCount} / ${questionsCount}`, 'i'))).toBeInTheDocument();
    
    // Restart quiz
    const tryAgainBtn = screen.getByText(/Try Again/i);
    fireEvent.click(tryAgainBtn);
    expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
  });

  it('prevents multiple selections and exercises early return', () => {
    render(<Quiz />);
    const options = screen.getAllByRole('radio');
    
    // First click
    fireEvent.click(options[0]);
    expect(options[0]).toBeChecked();
    
    // Attempt second click on same or different option
    fireEvent.click(options[1]);
    
    // Verify that the second option is not checked
    expect(options[1]).not.toBeChecked();
  });

  it('handles incorrect answers', () => {
    render(<Quiz />);
    const currentQ = CIVIC_MOCKS.quiz[0];
    const incorrectIdx = (currentQ.correct + 1) % 4;
    const options = screen.getAllByRole('radio');
    fireEvent.click(options[incorrectIdx]);
    
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText(/Why this is correct/i)).toBeInTheDocument();
  });
});
