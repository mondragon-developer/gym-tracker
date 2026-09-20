import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignUp from './SignUp.jsx';
import { useAuth } from '../hooks/useAuth.js';

vi.mock('../hooks/useAuth.js', () => ({ useAuth: vi.fn() }));
vi.mock('../hooks/useLanguage.js', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

const authMock = {
  signUp: vi.fn(),
  lookupTrainerCode: vi.fn(),
  lookupTrainerInvite: vi.fn(),
  resendConfirmation: vi.fn(),
  signInWithGoogle: vi.fn(),
};

const completeSignup = async () => {
  render(<SignUp onToggleMode={() => {}} />);
  fireEvent.change(screen.getByPlaceholderText('Enter your name'), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'new@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), { target: { value: 'secret1' } });
  fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'secret1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
  await screen.findByText('Check Your Email');
};

describe('SignUp confirmation resend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.signUp.mockResolvedValue({ data: {}, error: null });
    authMock.resendConfirmation.mockResolvedValue({ data: {}, error: null });
    useAuth.mockReturnValue(authMock);
  });

  it('resends the confirmation email from the success screen', async () => {
    await completeSignup();

    fireEvent.click(screen.getByRole('button', { name: 'Resend confirmation email' }));

    expect(authMock.resendConfirmation).toHaveBeenCalledWith('new@example.com');
    expect(await screen.findByText('Confirmation email sent!')).toBeInTheDocument();
    // The resend action is replaced by the success note after sending.
    expect(screen.queryByRole('button', { name: 'Resend confirmation email' })).not.toBeInTheDocument();
  });

  it('keeps the resend action available when the resend fails', async () => {
    authMock.resendConfirmation.mockResolvedValue({ data: null, error: new Error('boom') });
    await completeSignup();

    fireEvent.click(screen.getByRole('button', { name: 'Resend confirmation email' }));

    expect(await screen.findByRole('button', { name: 'Resend confirmation email' })).toBeInTheDocument();
    expect(screen.queryByText('Confirmation email sent!')).not.toBeInTheDocument();
  });
});

describe('SignUp with Google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue(authMock);
  });

  it('shows the Google option on a plain signup and calls signInWithGoogle', () => {
    render(<SignUp onToggleMode={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/ }));

    expect(authMock.signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('hides the Google option for trainer invitations', () => {
    render(<SignUp onToggleMode={() => {}} trainerInvite="ABCD1234" />);
    expect(screen.queryByRole('button', { name: /Continue with Google/ })).not.toBeInTheDocument();
  });

  it('hides the Google option when a trainer code is present', () => {
    render(<SignUp onToggleMode={() => {}} initialTrainerCode="AB12CD" />);
    expect(screen.queryByRole('button', { name: /Continue with Google/ })).not.toBeInTheDocument();
  });
});
