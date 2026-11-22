import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import AdminDashboard from './AdminDashboard.jsx';
import { UnitsProvider } from '../contexts/UnitsContext.jsx';

const auth = vi.hoisted(() => ({
  user: { id: 'trainer-1', email: 'trainer@example.com' },
  isAdmin: false,
  isTrainer: true,
}));

vi.mock('../hooks/useAuth.js', () => ({ useAuth: () => auth }));

vi.mock('../hooks/useLanguage.js', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('../services/AdminService', () => ({
  ADMIN_PAGE_SIZE: 25,
  adminService: {
    listUsers: vi.fn(),
    getUserProfile: vi.fn(),
    getWorkoutPlanRecord: vi.fn(),
    saveWorkoutPlan: vi.fn(),
    listTrainerLinks: vi.fn(),
    listTrainerInvites: vi.fn(),
    sendInviteEmail: vi.fn(),
    addTrainer: vi.fn(),
    removeTrainer: vi.fn(),
    setUserRole: vi.fn(),
  },
}));

// The mocked module, used to set per-test behavior of sendInviteEmail.
import { adminService } from '../services/AdminService';
import { appUpdates, createAppUpdateCoordinator } from '../services/AppUpdateService.js';
import { getWeekStart, addWeeks, formatWeekRange } from '../utils/dateHelper.js';
import { DAYS_OF_WEEK } from '../constants/AppConstants.js';

beforeEach(() => {
  auth.user = { id: 'trainer-1', email: 'trainer@example.com' };
  auth.isAdmin = false;
  auth.isTrainer = true;
  vi.clearAllMocks();
  adminService.listUsers.mockReset().mockResolvedValue({
    users: [{ id: 'client-1', email: 'client@example.com', role: 'user' }],
    hasMore: false,
  });
  adminService.getUserProfile.mockReset().mockResolvedValue({
    id: 'trainer-1', email: 'trainer@example.com', role: 'trainer', inviteCode: 'ABC123',
  });
  adminService.getWorkoutPlanRecord.mockReset().mockResolvedValue(null);
  adminService.saveWorkoutPlan.mockReset().mockResolvedValue({ ok: true, updatedAt: 'v2' });
  adminService.listTrainerLinks.mockReset().mockResolvedValue([]);
  adminService.listTrainerInvites.mockReset().mockResolvedValue([]);
  adminService.addTrainer.mockReset().mockResolvedValue(undefined);
  adminService.removeTrainer.mockReset().mockResolvedValue(undefined);
});

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
    await act(async () => {
      fireEvent.paste(document.body, { clipboardData });
    });
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

describe('AdminDashboard update protection', () => {
  let updates;
  let reload;

  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
  };
  const resetClientPlan = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reset?' }));
  };
  const openClient = async () => {
    const view = render(<AdminDashboard onBack={() => {}} />);
    fireEvent.click(await screen.findByText('client@example.com'));
    await screen.findByRole('button', { name: 'Import plan' });
    return view;
  };

  beforeEach(() => {
    reload = vi.fn();
    updates = createAppUpdateCoordinator({ dispatch: () => true, reload });
    vi.spyOn(appUpdates, 'protect').mockImplementation(updates.protect);
    const current = getWeekStart();
    adminService.getWorkoutPlanRecord.mockResolvedValue({
      data: {
        version: 2,
        currentWeekStart: current,
        weeks: { [current]: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, { name: 'Rest', exercises: [] }])) },
      },
      updatedAt: 'v1',
    });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('defers a pending update through dirty edits and the complete save request', async () => {
    const pending = deferred();
    adminService.saveWorkoutPlan.mockReturnValueOnce(pending.promise);
    await openClient();
    resetClientPlan();

    updates.request();
    expect(reload).not.toHaveBeenCalled();
    expect(updates.isProtected()).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(reload).not.toHaveBeenCalled();

    await act(async () => { pending.resolve({ ok: true, updatedAt: 'v2' }); });
    expect(reload).toHaveBeenCalledOnce();
    expect(updates.isProtected()).toBe(false);
  });

  it('keeps edits made during a save protected until their own save succeeds', async () => {
    const pending = deferred();
    adminService.saveWorkoutPlan.mockReturnValueOnce(pending.promise);
    await openClient();
    resetClientPlan();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    updates.request();
    fireEvent.click(screen.getByRole('button', { name: 'Reset to default' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm reset?' }));
      pending.resolve({ ok: true, updatedAt: 'v2' });
    });
    expect(reload).not.toHaveBeenCalled();
    expect(updates.isProtected()).toBe(true);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save changes' })); });
    expect(adminService.saveWorkoutPlan.mock.calls.at(-1)[2]).toEqual({ expectedUpdatedAt: 'v2', overwrite: false });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not mark a different client saved when an earlier request completes', async () => {
    adminService.listUsers.mockResolvedValue({
      users: [
        { id: 'client-1', email: 'client@example.com', role: 'user' },
        { id: 'client-2', email: 'second@example.com', role: 'user' },
      ],
      hasMore: false,
    });
    const pending = deferred();
    adminService.saveWorkoutPlan.mockReturnValueOnce(pending.promise);
    await openClient();
    resetClientPlan();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(screen.getByText('second@example.com'));
    await screen.findByRole('button', { name: 'Import plan' });
    resetClientPlan();
    updates.request();

    await act(async () => { pending.resolve({ ok: true, updatedAt: 'first-client-saved' }); });
    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'second@example.com' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save changes' })); });
    expect(adminService.saveWorkoutPlan).toHaveBeenLastCalledWith('client-2', expect.any(Object), {
      expectedUpdatedAt: 'v1', overwrite: false,
    });
    expect(reload).toHaveBeenCalledOnce();
  });

  it('keeps a request protected if the panel unmounts before it finishes', async () => {
    const pending = deferred();
    adminService.saveWorkoutPlan.mockReturnValueOnce(pending.promise);
    const view = await openClient();
    resetClientPlan();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    updates.request();
    view.unmount();
    expect(reload).not.toHaveBeenCalled();
    expect(updates.isProtected()).toBe(true);

    await act(async () => { pending.resolve({ ok: true, updatedAt: 'v2' }); });
    expect(reload).toHaveBeenCalledOnce();
    expect(updates.isProtected()).toBe(false);
  });

  it('retains dirty protection when the database rejects the save as a conflict', async () => {
    adminService.saveWorkoutPlan.mockResolvedValueOnce({ ok: false, reason: 'conflict' });
    await openClient();
    resetClientPlan();
    updates.request();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Save changes' })); });
    expect(reload).not.toHaveBeenCalled();
    expect(updates.isProtected()).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent("This client's plan changed since you opened it.");
  });
});

describe('AdminDashboard bounded user pages', () => {
  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
  };

  it('pages clients without downloading assignments and keeps the trainer invite available', async () => {
    adminService.listUsers
      .mockResolvedValueOnce({ users: [{ id: 'client-1', email: 'first@example.com', role: 'user' }], hasMore: true })
      .mockResolvedValueOnce({ users: [{ id: 'client-2', email: 'second@example.com', role: 'user' }], hasMore: false });
    render(<AdminDashboard onBack={() => {}} />);
    await screen.findByText('first@example.com');
    expect(screen.getByLabelText('Previous users page')).toBeDisabled();
    expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, pageSize: 25, excludeUserId: 'trainer-1' }));
    expect(adminService.listTrainerLinks).not.toHaveBeenCalled();
    expect(adminService.getWorkoutPlanRecord).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Next users page'));
    await screen.findByText('second@example.com');
    expect(screen.queryByText('first@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByLabelText('Next users page')).toBeDisabled();
    expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, excludeUserId: 'trainer-1' }));
    expect(adminService.getUserProfile).toHaveBeenCalledTimes(1);
  });

  it('resets to the first page when applying server-side email filters', async () => {
    adminService.listUsers.mockResolvedValue({ users: [{ id: 'client-1', email: 'client@example.com', role: 'user' }], hasMore: true });
    render(<AdminDashboard onBack={() => {}} />);
    await screen.findByText('client@example.com');
    fireEvent.click(screen.getByLabelText('Next users page'));
    await waitFor(() => expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    const search = screen.getByLabelText('Search users by email');
    fireEvent.change(search, { target: { value: '  another@example.com  ' } });
    fireEvent.submit(search.closest('form'));
    await waitFor(() => expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, search: 'another@example.com' })));
  });

  it('does not let an earlier user query replace the latest search results', async () => {
    const first = deferred();
    adminService.listUsers
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ users: [{ id: 'new', email: 'new@example.com', role: 'user' }], hasMore: false });
    render(<AdminDashboard onBack={() => {}} />);
    const search = screen.getByLabelText('Search users by email');
    fireEvent.change(search, { target: { value: 'new' } });
    fireEvent.submit(search.closest('form'));
    await screen.findByText('new@example.com');
    await act(async () => {
      first.resolve({ users: [{ id: 'old', email: 'old@example.com', role: 'user' }], hasMore: true });
    });
    expect(screen.queryByText('old@example.com')).not.toBeInTheDocument();
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
    expect(screen.getByLabelText('Next users page')).toBeDisabled();
    expect(adminService.listUsers.mock.calls[0][0].signal.aborted).toBe(true);
  });

  it('scopes assignment queries to visible clients and applies inactivity on the server', async () => {
    auth.isAdmin = true;
    auth.isTrainer = false;
    adminService.listUsers.mockResolvedValue({
      users: [
        { id: 'client-1', email: 'client@example.com', role: 'user' },
        { id: 'trainer-2', email: 'other-trainer@example.com', role: 'trainer' },
      ],
      hasMore: false,
    });
    render(<AdminDashboard onBack={() => {}} />);
    await screen.findByText('client@example.com');
    expect(adminService.listTrainerLinks).toHaveBeenCalledWith(['client-1'], expect.objectContaining({ signal: expect.any(AbortSignal) }));
    fireEvent.click(screen.getByLabelText('Inactive 60+ days only'));
    await waitFor(() => expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, onlyInactive: true })));
  });

  it('loads assignment choices on demand and can assign a trainer outside the user page', async () => {
    auth.isAdmin = true;
    auth.isTrainer = false;
    adminService.listUsers.mockImplementation(options => Promise.resolve(
      options.role === 'trainer'
        ? { users: [{ id: 'remote-trainer', email: 'remote-trainer@example.com', role: 'trainer' }], hasMore: false }
        : { users: [{ id: 'client-1', email: 'client@example.com', role: 'user' }], hasMore: false }
    ));
    render(<AdminDashboard onBack={() => {}} />);
    await screen.findByText('client@example.com');
    expect(adminService.listUsers).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Add trainer...' }));
    const select = await screen.findByRole('option', { name: 'remote-trainer@example.com' });
    fireEvent.change(select.closest('select'), { target: { value: 'remote-trainer' } });
    await waitFor(() => expect(adminService.addTrainer).toHaveBeenCalledWith('client-1', 'remote-trainer'));
    expect(await screen.findByLabelText('Remove trainer remote-trainer@example.com — client@example.com')).toBeInTheDocument();
  });

  it('preserves removal controls for assigned trainers outside the current user page', async () => {
    auth.isAdmin = true;
    auth.isTrainer = false;
    adminService.listTrainerLinks.mockResolvedValue([{
      trainerId: 'remote-trainer',
      clientId: 'client-1',
      trainer: { id: 'remote-trainer', email: 'remote-trainer@example.com' },
    }]);
    render(<AdminDashboard onBack={() => {}} />);
    const remove = await screen.findByLabelText('Remove trainer remote-trainer@example.com — client@example.com');
    fireEvent.click(remove);
    await waitFor(() => expect(adminService.removeTrainer).toHaveBeenCalledWith('client-1', 'remote-trainer'));
    expect(screen.queryByText('remote-trainer@example.com')).not.toBeInTheDocument();
  });

  it('discards a previous client plan response after another client is selected', async () => {
    const first = deferred();
    adminService.listUsers.mockResolvedValue({
      users: [
        { id: 'client-1', email: 'first@example.com', role: 'user' },
        { id: 'client-2', email: 'second@example.com', role: 'user' },
      ],
      hasMore: false,
    });
    adminService.getWorkoutPlanRecord.mockReturnValueOnce(first.promise).mockResolvedValueOnce(null);
    render(<AdminDashboard onBack={() => {}} />);
    fireEvent.click(await screen.findByText('first@example.com'));
    fireEvent.click(screen.getByText('second@example.com'));
    await screen.findByRole('heading', { name: 'second@example.com' });
    const current = getWeekStart();
    await act(async () => {
      first.resolve({
        data: { version: 2, currentWeekStart: current, weeks: { [current]: Object.fromEntries(DAYS_OF_WEEK.map(day => [day, { name: 'Rest', exercises: [] }])) } },
        updatedAt: 'first-client-version',
      });
    });
    expect(screen.getByRole('heading', { name: 'second@example.com' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Previous week')).not.toBeInTheDocument();
  });
});

it('can page past already assigned trainers and search the full trainer directory', async () => {
  auth.isAdmin = true;
  auth.isTrainer = false;
  adminService.listTrainerLinks.mockResolvedValue([{
    trainerId: 'assigned',
    clientId: 'client-1',
    trainer: { id: 'assigned', email: 'assigned@example.com' },
  }]);
  adminService.listUsers.mockImplementation(options => Promise.resolve(
    options.role === 'trainer'
      ? {
          users: options.page === 0 && !options.search
            ? [{ id: 'assigned', email: 'assigned@example.com', role: 'trainer' }]
            : [{ id: 'available', email: 'available@example.com', role: 'trainer' }],
          hasMore: options.page === 0 && !options.search,
        }
      : { users: [{ id: 'client-1', email: 'client@example.com', role: 'user' }], hasMore: false }
  ));
  render(<AdminDashboard onBack={() => {}} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add trainer...' }));
  await screen.findByText('No available trainers on this page.');
  expect(screen.getByRole('combobox', { name: 'Choose a trainer' })).toBeDisabled();
  fireEvent.click(screen.getByLabelText('Next trainer page'));
  await screen.findByRole('option', { name: 'available@example.com' });
  expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'trainer', page: 1 }));

  const search = screen.getByLabelText('Search trainers by email');
  fireEvent.change(search, { target: { value: 'available' } });
  fireEvent.submit(search.closest('form'));
  await waitFor(() => expect(adminService.listUsers).toHaveBeenLastCalledWith(expect.objectContaining({ role: 'trainer', page: 0, search: 'available' })));
});
