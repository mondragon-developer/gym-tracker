import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignIn from './SignIn.jsx';
import { useAuth } from '../hooks/useAuth.js';

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useLanguage.js', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const submitSignIn = (email, password) => {
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
};

describe('SignIn resend confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers to resend the confirmation email after an email-not-confirmed error', async () => {
    const signIn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'email_not_confirmed', message: 'Email not confirmed' },
    });
    const resendConfirmation = vi.fn().mockResolvedValue({ data: {}, error: null });
    useAuth.mockReturnValue({ signIn, resendConfirmation });

    render(<SignIn onToggleMode={() => {}} onForgotPassword={() => {}} />);
    submitSignIn('unconfirmed@example.com', 'secret1');

    // The friendly translated error appears, plus the resend action.
    expect(await screen.findByText(/confirm your email before signing in/)).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Resend confirmation email' }));

    expect(resendConfirmation).toHaveBeenCalledWith('unconfirmed@example.com');
    expect(await screen.findByText('Confirmation email sent!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend confirmation email' })).not.toBeInTheDocument();
  });

  it('does not offer a resend for other sign-in errors', async () => {
    const signIn = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
    });
    useAuth.mockReturnValue({ signIn, resendConfirmation: vi.fn() });

    render(<SignIn onToggleMode={() => {}} onForgotPassword={() => {}} />);
    submitSignIn('someone@example.com', 'wrongpass');

    expect(await screen.findByText('Incorrect email or password. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resend confirmation email' })).not.toBeInTheDocument();
  });

  it('signs in with Google via the OAuth button', () => {
    const signIn = vi.fn();
    const signInWithGoogle = vi.fn();
    useAuth.mockReturnValue({ signIn, signInWithGoogle, resendConfirmation: vi.fn() });

    render(<SignIn onToggleMode={() => {}} onForgotPassword={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/ }));

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(signIn).not.toHaveBeenCalled();
  });
});
