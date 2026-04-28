import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimelineArchitect } from './TimelineArchitect';
import { useAgentStream } from '../../../hooks/useAgentStream';
import { useMultimedia } from '../../../hooks/useMultimedia';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => def,
    i18n: { language: 'en' }
  })
}));

vi.mock('../../../hooks/useAgentStream', () => ({
  useAgentStream: vi.fn()
}));

vi.mock('../../../hooks/useMultimedia', () => ({
  useMultimedia: vi.fn()
}));

describe('TimelineArchitect', () => {
  beforeEach(() => {
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: vi.fn()
    } as any);

    vi.mocked(useMultimedia).mockReturnValue({
      generateContent: vi.fn(),
      content: null,
      loading: false,
      error: null
    } as any);
  });

  it('renders initial phases correctly', () => {
    render(<TimelineArchitect />);
    expect(screen.getByText('Election Journey Storyboard')).toBeInTheDocument();
    expect(screen.getAllByText('Announcement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Registration').length).toBeGreaterThan(0);
  });

  it('changes phase when a chapter button is clicked', () => {
    render(<TimelineArchitect />);
    const regChapter = screen.getByText('Registration');
    fireEvent.click(regChapter);

    expect(screen.getByText(/What happens during/i)).toBeInTheDocument();
  });

  it('triggers AI Deep Dive on button click', () => {
    const mockSubmit = vi.fn();
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'idle',
      activeAgent: null,
      submit: mockSubmit
    } as any);

    render(<TimelineArchitect />);
    const deepDiveBtn = screen.getByText('Deep Dive with AI Guide');
    fireEvent.click(deepDiveBtn);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.stringContaining('Announcement'),
      'IN',
      'timeline',
      'en'
    );
  });

  it('triggers multimedia generation on button click', () => {
    const mockGenerateContent = vi.fn();
    vi.mocked(useMultimedia).mockReturnValue({
      generateContent: mockGenerateContent,
      content: null,
      loading: false,
      error: null
    } as any);

    render(<TimelineArchitect />);
    const generateBtn = screen.getByText('Generate MultiModal Pack');
    fireEvent.click(generateBtn);

    expect(mockGenerateContent).toHaveBeenCalledWith('Announcement', 'en');
  });

  it('navigates to next chapter correctly', () => {
    render(<TimelineArchitect />);
    const nextBtn = screen.getByText('Next Chapter →');
    fireEvent.click(nextBtn);

    expect(screen.getByText(/What happens during/i)).toBeInTheDocument();
  });

  it('allows closing AI insights', () => {
    render(<TimelineArchitect />);
    const deepDiveBtn = screen.getByText('Deep Dive with AI Guide');
    fireEvent.click(deepDiveBtn);
    
    const closeBtn = screen.getByText('Close AI Insights');
    fireEvent.click(closeBtn);
    
    expect(screen.queryByText('Close AI Insights')).not.toBeInTheDocument();
  });

  it('renders multimedia content when available', () => {
    vi.mocked(useMultimedia).mockReturnValue({
      generateContent: vi.fn(),
      content: {
        infographic_url: 'http://img.png',
        audio_url: 'http://aud.mp3',
        video_url: 'http://vid.mp4',
        topic: 'test'
      },
      loading: false,
      error: null
    } as any);

    render(<TimelineArchitect />);
    
    expect(screen.getByAltText('Infographic')).toHaveAttribute('src', 'http://img.png');
    // Check for audio element
    const audio = document.querySelector('audio');
    expect(audio).toBeInTheDocument();
    // Check for iframe (video)
    const iframe = screen.getByTitle('Video guide');
    expect(iframe).toHaveAttribute('src', 'http://vid.mp4');
  });

  it('shows active agent during AI insights', () => {
    vi.mocked(useAgentStream).mockReturnValue({
      output: 'Insight content',
      status: 'streaming',
      activeAgent: 'ArchitectAgent',
      submit: vi.fn()
    } as any);

    render(<TimelineArchitect />);
    const deepDiveBtn = screen.getByText('Deep Dive with AI Guide');
    fireEvent.click(deepDiveBtn);
    
    expect(screen.getByText(/ArchitectAgent Active/i)).toBeInTheDocument();
    expect(screen.getByText('Insight content')).toBeInTheDocument();
  });

  it('shows loading state in AI insights when output is empty', () => {
    vi.mocked(useAgentStream).mockReturnValue({
      output: '',
      status: 'streaming',
      activeAgent: 'ArchitectAgent',
      submit: vi.fn()
    } as any);

    render(<TimelineArchitect />);
    const deepDiveBtn = screen.getByText('Deep Dive with AI Guide');
    fireEvent.click(deepDiveBtn);
    
    expect(screen.getByText(/Synthesizing granular chapter insights/i)).toBeInTheDocument();
  });

  it('shows loading state during multimedia generation', () => {
    vi.mocked(useMultimedia).mockReturnValue({
      generateContent: vi.fn(),
      content: null,
      loading: true,
      error: null
    } as any);

    render(<TimelineArchitect />);
    expect(screen.getByText(/Generating Assets.../i)).toBeInTheDocument();
  });
});
