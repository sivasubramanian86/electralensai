import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RumorGuard } from './RumorGuard';
import { useAgentStream } from '../../../hooks/useAgentStream';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => def,
    i18n: { language: 'en' }
  })
}));

vi.mock('../../../hooks/useAgentStream', () => ({
  useAgentStream: vi.fn(() => ({
    output: '',
    status: 'idle',
    activeAgent: null,
    submit: vi.fn(),
    reset: vi.fn()
  }))
}));

describe('RumorGuard', () => {
  it('renders initial state correctly', () => {
    render(<RumorGuard />);
    expect(screen.getByText('Myth-Buster Companion')).toBeInTheDocument();
  });

  it('handles search input and submission', () => {
    const mockSubmit = vi.fn();
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: mockSubmit,
      reset: vi.fn()
    });

    render(<RumorGuard />);
    const input = screen.getByPlaceholderText(/Paste a viral forward/i);
    const button = screen.getByText('Verify');

    fireEvent.change(input, { target: { value: 'Test Claim' } });
    fireEvent.click(button);

    expect(mockSubmit).toHaveBeenCalled();
  });

  it('handles Enter key submission', () => {
    const mockSubmit = vi.fn();
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: mockSubmit,
      reset: vi.fn()
    });

    render(<RumorGuard />);
    const input = screen.getByPlaceholderText(/Paste a viral forward/i);
    fireEvent.change(input, { target: { value: 'Enter key test' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockSubmit).toHaveBeenCalled();
  });

  it('handles trending myth clicks', () => {
    const mockSubmit = vi.fn();
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: mockSubmit,
      reset: vi.fn()
    });

    render(<RumorGuard />);
    // Find a myth and click it
    const myth = screen.getByText(/You can vote using your digital Aadhaar card/i);
    fireEvent.click(myth);

    expect(mockSubmit).toHaveBeenCalled();
  });

  it('prevents search for empty query', () => {
    const mockSubmit = vi.fn();
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: mockSubmit,
      reset: vi.fn()
    });

    render(<RumorGuard />);
    const button = screen.getByText('Verify');
    fireEvent.click(button);

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('displays active agent name', () => {
    vi.mocked(useAgentStream).mockReturnValue({
      output: 'Analysis...',
      status: 'streaming',
      activeAgent: 'MythBuster',
      submit: vi.fn(),
      reset: vi.fn()
    });

    render(<RumorGuard />);
    expect(screen.getByText(/Agent: MythBuster/i)).toBeInTheDocument();
  });

  it('displays loading message when output is empty during streaming', () => {
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'streaming',
      activeAgent: 'MythBuster',
      submit: vi.fn(),
      reset: vi.fn()
    });

    render(<RumorGuard />);
    expect(screen.getByText(/Consulting official election guidelines/i)).toBeInTheDocument();
  });
});
