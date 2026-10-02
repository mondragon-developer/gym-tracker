import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import UserProfile from './UserProfile.jsx';
const auth = vi.hoisted(() => ({ user: { id: 'client', email: 'client@example.test' }, updateProfile: vi.fn(), signOut: vi.fn() }));
const access = vi.hoisted(() => ({ listMyTrainers: vi.fn(), previewTrainer: vi.fn(), approveTrainer: vi.fn(), removeTrainerAccess: vi.fn() }));
vi.mock('../hooks/useAuth.js', () => ({ useAuth: () => auth }));
vi.mock('../hooks/useLanguage.js', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('../services/TrainerAccessService.js', () => access);

beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
    auth.user = { id: 'client', email: 'client@example.test' };
    access.listMyTrainers.mockResolvedValue([]);
});

it('opening an invite URL displays a review without granting access', async () => {
    window.history.replaceState({}, '', '/?trainer=ABC123&keep=yes');
    render(<UserProfile />);
    expect(await screen.findByLabelText('Trainer code')).toHaveValue('ABC123');
    await screen.findByText('No connected trainers.');
    expect(access.approveTrainer).not.toHaveBeenCalled();
    expect(window.location.search).toBe('?keep=yes');
});

it('a signup invitation survives email confirmation as pending metadata only', async () => {
    auth.user.user_metadata = { pending_trainer_code: 'ABC123' };
    render(<UserProfile />);
    expect(await screen.findByLabelText('Trainer code')).toHaveValue('ABC123');
    await screen.findByText('No connected trainers.');
    fireEvent.click(screen.getByRole('button', { name: 'Close', exact: true }));
    expect(auth.updateProfile).toHaveBeenCalledWith({ pending_trainer_code: null });
    expect(access.approveTrainer).not.toHaveBeenCalled();
});

it('allows an existing user to open connected trainers from the profile', async () => {
    render(<UserProfile />);
    fireEvent.click(screen.getByRole('button', { name: /client@example.test/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Connected trainers' }));
    await screen.findByText('No connected trainers.');
});
