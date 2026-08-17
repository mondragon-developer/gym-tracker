import { describe, it, expect } from 'vitest';
import { isValidEmail, buildInviteUrl, buildInviteEmail } from './inviteEmail.js';

describe('isValidEmail', () => {
    it('accepts ordinary addresses', () => {
        expect(isValidEmail('client@example.com')).toBe(true);
        expect(isValidEmail('  padded@example.com  ')).toBe(true);
    });

    it('rejects malformed input', () => {
        expect(isValidEmail('not-an-email')).toBe(false);
        expect(isValidEmail('missing@domain')).toBe(false);
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail(null)).toBe(false);
        expect(isValidEmail(undefined)).toBe(false);
    });
});

describe('buildInviteUrl', () => {
    it('appends the trainer code as the invite query param', () => {
        expect(buildInviteUrl('https://app.example', 'ABC123'))
            .toBe('https://app.example/?trainer=ABC123');
    });

    it('tolerates trailing slashes on the app URL', () => {
        expect(buildInviteUrl('https://app.example/', 'ABC123'))
            .toBe('https://app.example/?trainer=ABC123');
    });
});

describe('buildInviteEmail', () => {
    const { subject, html } = buildInviteEmail({ inviteUrl: 'https://app.example/?trainer=ABC123' });

    it('is bilingual', () => {
        expect(subject).toContain('invitation');
        expect(subject).toContain('invitación');
        expect(html).toContain('Your trainer has invited you');
        expect(html).toContain('Tu entrenador te ha invitado');
    });

    it('links the call-to-action to the invite URL', () => {
        expect(html).toContain('href="https://app.example/?trainer=ABC123"');
    });
});
