import { describe, it, expect, beforeEach } from 'vitest';
import { isInviteNoticeRelevant, isInviteNoticeDismissed, dismissInviteNotice } from './inviteNotice.js';

const invitedUser = { id: 'u1', user_metadata: { trainer_invite_code: 'ABC123' } };
const plainUser = { id: 'u2', user_metadata: { name: 'No Invite' } };

describe('isInviteNoticeRelevant', () => {
    it('is true when the signup carried a trainer invite but the role is user', () => {
        expect(isInviteNoticeRelevant(invitedUser, 'user')).toBe(true);
    });

    it('is false when the invite took effect (trainer role)', () => {
        expect(isInviteNoticeRelevant(invitedUser, 'trainer')).toBe(false);
    });

    it('is false for admins (they outrank the trainer role)', () => {
        expect(isInviteNoticeRelevant(invitedUser, 'admin')).toBe(false);
    });

    it('is false without invite metadata, and for a null user', () => {
        expect(isInviteNoticeRelevant(plainUser, 'user')).toBe(false);
        expect(isInviteNoticeRelevant(null, 'user')).toBe(false);
        expect(isInviteNoticeRelevant(undefined, 'user')).toBe(false);
    });
});

describe('invite notice dismissal', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('is not dismissed by default', () => {
        expect(isInviteNoticeDismissed('u1')).toBe(false);
    });

    it('round-trips the dismissal per user', () => {
        dismissInviteNotice('u1');
        expect(isInviteNoticeDismissed('u1')).toBe(true);
        expect(isInviteNoticeDismissed('u2')).toBe(false);
    });
});
