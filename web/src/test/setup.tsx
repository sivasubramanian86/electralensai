import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Global mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, d?: string) => d || k,
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue(undefined),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('lucide-react', () => {
  const mockIcon = (name: string) => {
    const Component = (props: React.ComponentProps<'div'>) => <div data-testid={`icon-${name}`} {...props} />;
    Component.displayName = name;
    return Component;
  };

  return {
    LayoutDashboard: mockIcon('LayoutDashboard'),
    CalendarDays: mockIcon('CalendarDays'),
    ShieldCheck: mockIcon('ShieldCheck'),
    Dna: mockIcon('Dna'),
    Settings: mockIcon('Settings'),
    ChevronRight: mockIcon('ChevronRight'),
    Landmark: mockIcon('Landmark'),
    Accessibility: mockIcon('Accessibility'),
    ShieldAlert: mockIcon('ShieldAlert'),
    BarChart3: mockIcon('BarChart3'),
    BookOpen: mockIcon('BookOpen'),
    Flame: mockIcon('Flame'),
    Star: mockIcon('Star'),
    Trophy: mockIcon('Trophy'),
    Zap: mockIcon('Zap'),
    Search: mockIcon('Search'),
    Bell: mockIcon('Bell'),
    BellRing: mockIcon('BellRing'),
    Globe2: mockIcon('Globe2'),
    Command: mockIcon('Command'),
    LogIn: mockIcon('LogIn'),
    LogOut: mockIcon('LogOut'),
    User: mockIcon('User'),
    Users: mockIcon('Users'),
    Loader2: mockIcon('Loader2'),
    Play: mockIcon('Play'),
    Megaphone: mockIcon('Megaphone'),
    CheckSquare: mockIcon('CheckSquare'),
    Sparkles: mockIcon('Sparkles'),
    Image: mockIcon('Image'),
    Volume2: mockIcon('Volume2'),
    Video: mockIcon('Video'),
    ExternalLink: mockIcon('ExternalLink'),
    Info: mockIcon('Info'),
    ShieldQuestion: mockIcon('ShieldQuestion'),
    ArrowLeft: mockIcon('ArrowLeft'),
    ArrowRight: mockIcon('ArrowRight'),
    RotateCcw: mockIcon('RotateCcw'),
    Terminal: mockIcon('Terminal'),
    Shield: mockIcon('Shield'),
    Activity: mockIcon('Activity'),
    Clock: mockIcon('Clock'),
    CheckCircle2: mockIcon('CheckCircle2'),
    AlertCircle: mockIcon('AlertCircle'),
  };
});

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});
