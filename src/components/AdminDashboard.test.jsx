import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminDashboard from './AdminDashboard.jsx';

// Logged in as a trainer with one profile row carrying an invite code, so the
// "Your invite code" copy controls render.
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'trainer-1', email: 'trainer@example.com' },
    isAdmin: false,
    isTrainer: true,
  }),
}));

vi.mock('../hooks/useLanguage.js', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('../services/AdminService', () => ({
  adminService: {
    listUsers: vi.fn().mockResolvedValue([
      { id: 'trainer-1', email: 'trainer@example.com', role: 'trainer', inviteCode: 'ABC123', trainerId: null },
    ]),
    listTrainerInvites: vi.fn().mockResolvedValue([]),
    sendInviteEmail: vi.fn(),
  },
}));

// The mocked module, used to set per-test behavior of sendInviteEmail.
import { adminService } from '../services/AdminService';

// NOTE: fake timers are enabled only AFTER the async render settles - waitFor
// (used by findBy*) polls with setInterval, which frozen timers would stall.

describe('AdminDashboard copy indicator timer', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderAsTrainer = async () => {
    const utils = render(<AdminDashboard onBack={() => {}} />);
    const copyButton = await screen.findByText('Copy');
    vi.useFakeTimers();
    return { ...utils, copyButton };
  };

  it('shows "Copied!" and hides it again after 2 seconds', async () => {
    const { copyButton } = await renderAsTrainer();
    await act(async () => {
      fireEvent.click(copyButton);
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('re-arms the timer on a rapid second copy instead of hiding early', async () => {
    const { copyButton } = await renderAsTrainer();

    await act(async () => {
      fireEvent.click(copyButton);
    });
    // Second copy 1.5s later (the other button): the first timer must not
    // clear the new indicator at the 2s mark.
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      fireEvent.click(screen.getByText(/Copy invite link/));
    });

    act(() => {
      vi.advanceTimersByTime(600); // 2.1s after the first copy
    });
    // Regex: the link button's text is "🔗 Copied!" (two text nodes).
    expect(screen.getByText(/Copied!/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500); // past the re-armed 2s window
    });
    expect(screen.queryByText(/Copied!/)).not.toBeInTheDocument();
  });

  it('cancels the pending timer on unmount without errors', async () => {
    const { copyButton, unmount } = await renderAsTrainer();
    await act(async () => {
      fireEvent.click(copyButton);
    });

    unmount();
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});

describe('AdminDashboard invite by email', () => {
  beforeEach(() => {
    adminService.sendInviteEmail.mockReset();
    adminService.sendInviteEmail.mockResolvedValue({ sent: true });
  });

  it('emails the trainer invite link from the panel', async () => {
    render(<AdminDashboard onBack={() => {}} />);
    const input = await screen.findByPlaceholderText("Client's email");
    fireEvent.change(input, { target: { value: 'client@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send invite/ }));

    expect(await screen.findByText('Invitation sent!')).toBeInTheDocument();
    expect(adminService.sendInviteEmail).toHaveBeenCalledWith('client@example.com');
  });

  it('shows an error message when the send fails', async () => {
    adminService.sendInviteEmail.mockRejectedValueOnce(new Error('boom'));
    render(<AdminDashboard onBack={() => {}} />);
    const input = await screen.findByPlaceholderText("Client's email");
    fireEvent.change(input, { target: { value: 'client@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send invite/ }));

    expect(await screen.findByText('Could not send the invitation. Please try again.')).toBeInTheDocument();
  });
});
