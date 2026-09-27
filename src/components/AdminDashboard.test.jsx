import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminDashboard from './AdminDashboard.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';

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
      { id: 'trainer-1', email: 'trainer@example.com', role: 'trainer', inviteCode: 'ABC123' },
      { id: 'client-1', email: 'client@example.com', role: 'user' },
    ]),
    getWorkoutPlanRecord: vi.fn().mockResolvedValue(null),
    saveWorkoutPlan: vi.fn().mockResolvedValue({ ok: true, updatedAt: 'v2' }),
    listTrainerLinks: vi.fn().mockResolvedValue([]),
    listTrainerInvites: vi.fn().mockResolvedValue([]),
    sendInviteEmail: vi.fn(),
  },
}));

// The mocked module, used to set per-test behavior of sendInviteEmail.
import { adminService } from '../services/AdminService';
import { getWeekStart, addWeeks, formatWeekRange } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

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

describe('AdminDashboard import plan', () => {
  const restWeek = () => Object.fromEntries(DAYS_OF_WEEK.map(day => [day, { name: 'Rest', exercises: [] }]));

  it('offers Import plan on the current week and disables it on a past week', async () => {
    const current = getWeekStart();
    adminService.getWorkoutPlanRecord.mockResolvedValueOnce({
      data: {
        version: 2,
        currentWeekStart: current,
        weeks: { [addWeeks(current, -1)]: restWeek(), [current]: restWeek() },
      },
      updatedAt: 'v1',
    });
    render(<AdminDashboard onBack={() => {}} />);
    fireEvent.click(await screen.findByText('client@example.com'));
    const importButton = await screen.findByRole('button', { name: 'Import plan' });
    expect(importButton).not.toBeDisabled();
    fireEvent.click(screen.getByLabelText('Previous week'));
    expect(screen.getByRole('button', { name: 'Import plan' })).toBeDisabled();
  });

  it('shows the coach plan bar and imports it into the open client', async () => {
    const current = getWeekStart();
    adminService.getWorkoutPlanRecord.mockResolvedValueOnce({
      data: { version: 2, currentWeekStart: current, weeks: { [current]: restWeek() } },
      updatedAt: 'v1',
    });
    const coachPlan = { plan: 'GYMPLAN v1\nMonday: Chest\n- Barbell Bench Press 4x8', dismiss: vi.fn() };
    render(<UnitsProvider><AdminDashboard onBack={() => {}} coachPlan={coachPlan} /></UnitsProvider>);
    expect(await screen.findByText('Open a client to import this plan.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import' })).toBeNull();

    fireEvent.click(await screen.findByText('client@example.com'));
    await screen.findByRole('button', { name: 'Import plan' });
    expect(screen.getByText(/^client@example\.com · Week of /)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    expect(coachPlan.dismiss).toHaveBeenCalled();
    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    expect(screen.queryByLabelText('Paste the plan here')).toBeNull();
    expect(screen.getByText(/^client@example\.com · Week of /, { selector: 'strong' })).toBeInTheDocument();
  });

  it('says the plan is loading, then names the calendar week for a client with no plan', async () => {
    let resolveRecord;
    adminService.getWorkoutPlanRecord.mockReturnValueOnce(new Promise(resolve => { resolveRecord = resolve; }));
    const coachPlan = { plan: 'GYMPLAN v1', dismiss: vi.fn() };
    render(<UnitsProvider><AdminDashboard onBack={() => {}} coachPlan={coachPlan} /></UnitsProvider>);
    fireEvent.click(await screen.findByText('client@example.com'));
    expect(await screen.findByText(/^Loading plan for client@example\.com/, { selector: 'span' })).toBeInTheDocument();
    await act(async () => { resolveRecord(null); });
    expect(await screen.findByText(`client@example.com · Week of ${formatWeekRange(getWeekStart(), 'en')}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
  });

  it('opens the client preview when a plan is pasted in the panel', async () => {
    const current = getWeekStart();
    adminService.getWorkoutPlanRecord.mockResolvedValueOnce({
      data: { version: 2, currentWeekStart: current, weeks: { [current]: restWeek() } },
      updatedAt: 'v1',
    });
    render(<UnitsProvider><AdminDashboard onBack={() => {}} /></UnitsProvider>);
    fireEvent.click(await screen.findByText('client@example.com'));
    await screen.findByRole('button', { name: 'Import plan' });
    const clipboardData = { getData: () => 'GYMPLAN v1\nMonday: Chest\n- Barbell Bench Press 4x8' };
    fireEvent.paste(document.body, { clipboardData });
    expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
  });
});

describe('AdminDashboard save conflict', () => {
  const restWeek = () => Object.fromEntries(DAYS_OF_WEEK.map(day => [day, { name: 'Rest', exercises: [] }]));

  it('refuses to clobber a newer save and offers Load latest or Keep mine', async () => {
    const current = getWeekStart();
    adminService.getWorkoutPlanRecord.mockResolvedValueOnce({
      data: { version: 2, currentWeekStart: current, weeks: { [current]: restWeek() } },
      updatedAt: 'v1',
    });
    adminService.saveWorkoutPlan.mockResolvedValueOnce({ ok: false, reason: 'conflict' });
    render(<AdminDashboard onBack={() => {}} />);
    fireEvent.click(await screen.findByText('client@example.com'));
    await screen.findByRole('button', { name: 'Import plan' });
    fireEvent.click(screen.getByText('Reset to default'));
    fireEvent.click(screen.getByText('Confirm reset?'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    });
    expect(adminService.saveWorkoutPlan).toHaveBeenLastCalledWith('client-1', expect.any(Object), { expectedUpdatedAt: 'v1', overwrite: false });
    expect(await screen.findByRole('alert')).toHaveTextContent("This client's plan changed since you opened it.");
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Keep mine' }));
    });
    expect(adminService.saveWorkoutPlan).toHaveBeenLastCalledWith('client-1', expect.any(Object), { expectedUpdatedAt: 'v1', overwrite: true });
    expect(await screen.findByText(/Saved/)).toBeInTheDocument();
  });
});
