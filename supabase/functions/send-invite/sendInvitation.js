// Reservation counts attempts, including provider failures. Retrying must not
// bypass the rolling limits, and an unavailable database must never allow a send.
export async function sendInvitation({ service, userId, apiKey, message, fetchFn = fetch }) {
    try {
        const { data, error } = await service.rpc('reserve_invite_send', { caller_id: userId });
        if (error || typeof data !== 'boolean') {
            return { status: 503, body: { error: 'Could not check invitation limit. Try again later.' } };
        }
        if (!data) return { status: 429, body: { error: 'Invitation limit reached. Try again later.' } };
        const response = await fetchFn('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
            body: JSON.stringify(message),
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) return { status: 502, body: { error: 'Could not send the invitation.' } };
        return { status: 200, body: { sent: true } };
    } catch {
        return { status: 503, body: { error: 'Invitation service unavailable. Try again later.' } };
    }
}
