import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ReactI18next from 'react-i18next';

vi.mock('../auth/LoginButton', () => ({
  LoginButton: () => <div data-testid="login-button">Login</div>
}));

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header correctly', () => {
    render(<Header />);
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('toggles the notifications dropdown and allows marking all as read', () => {
    render(<Header />);
    const bellBtn = screen.getByLabelText(/View notifications/i);
    
    // Initially hidden
    expect(screen.queryByText('Voter Registration')).not.toBeInTheDocument();
    
    // Open dropdown
    fireEvent.click(bellBtn);
    expect(screen.getByText('Voter Registration')).toBeInTheDocument();
    expect(screen.getByText('Myth-Buster Alert')).toBeInTheDocument();
    
    // Test marking all as read
    const markReadBtn = screen.getByText(/Mark all as read/i);
    expect(markReadBtn).not.toBeDisabled();
    fireEvent.click(markReadBtn);
    expect(markReadBtn).toBeDisabled(); // Disabled after everything is read
    
    // Close dropdown
    fireEvent.click(bellBtn);
    expect(screen.queryByText('Voter Registration')).not.toBeInTheDocument();
  });

  it('changes application language when select is used', () => {
    const changeLanguageMock = vi.fn();
     
    vi.mocked(ReactI18next.useTranslation).mockReturnValue({
      t: (k: string) => k,
      i18n: { language: 'en', changeLanguage: changeLanguageMock },
      ready: true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<Header />);
    const languageSelect = screen.getByRole('combobox');
    
    fireEvent.change(languageSelect, { target: { value: 'hi' } });
    expect(changeLanguageMock).toHaveBeenCalledWith('hi');
  });
});
