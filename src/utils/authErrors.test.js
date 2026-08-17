import { describe, it, expect } from 'vitest';
import { friendlyAuthError } from './authErrors.js';

describe('friendlyAuthError', () => {
    it('maps invalid_credentials by code', () => {
        expect(friendlyAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' }))
            .toBe('Incorrect email or password. Please try again.');
    });

    it('maps email_not_confirmed by code', () => {
        expect(friendlyAuthError({ code: 'email_not_confirmed', message: 'Email not confirmed' }))
            .toBe('Please confirm your email before signing in. Check your inbox for the confirmation link.');
    });

    it('maps user_already_exists by code', () => {
        expect(friendlyAuthError({ code: 'user_already_exists', message: 'User already registered' }))
            .toBe('An account with this email already exists. Try signing in instead.');
    });

    it('maps the email rate-limit code', () => {
        expect(friendlyAuthError({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' }))
            .toBe('Too many emails requested. Please wait a while before trying again.');
    });

    it('falls back to message matching when there is no code', () => {
        expect(friendlyAuthError({ message: 'Invalid login credentials' }))
            .toBe('Incorrect email or password. Please try again.');
    });

    it('maps HTTP 429 without a recognizable message to the rate-limit text', () => {
        expect(friendlyAuthError({ status: 429, message: '{}' }))
            .toBe('Too many attempts. Please wait a few minutes and try again.');
    });

    it('maps network failures to the connection message', () => {
        expect(friendlyAuthError({ message: 'TypeError: Failed to fetch' }))
            .toBe('Could not reach the server. Check your connection and try again.');
    });

    it('returns the generic message for empty server bodies like "{}"', () => {
        expect(friendlyAuthError({ status: 500, message: '{}' }))
            .toBe('Something went wrong. Please try again in a moment.');
    });

    it('returns the generic message for null or undefined errors', () => {
        expect(friendlyAuthError(null)).toBe('Something went wrong. Please try again in a moment.');
        expect(friendlyAuthError(undefined)).toBe('Something went wrong. Please try again in a moment.');
    });
});
