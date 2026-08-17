/**
 * Pure helpers for the send-invite Edge Function.
 *
 * Kept free of Deno and browser APIs so the same module runs in the edge
 * runtime (imported by ./index.ts) and in the app's Vitest suite
 * (./inviteEmail.test.js).
 */

/**
 * Minimal email shape check; the real validation is the recipient's inbox.
 * @param {unknown} email
 * @returns {boolean}
 */
export const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());

/**
 * The signup URL that auto-assigns the new account to the trainer whose
 * invite code it carries. Trailing slashes on the app URL are tolerated.
 * @param {string} appUrl - e.g. https://gymworkoutjm.vercel.app
 * @param {string} code - The trainer's profiles.invite_code
 * @returns {string}
 */
export const buildInviteUrl = (appUrl, code) =>
    `${String(appUrl).replace(/\/+$/, '')}/?trainer=${encodeURIComponent(code)}`;

/**
 * Bilingual (EN + ES) invite email, matching the branded auth templates in
 * supabase/email-templates.md. Bilingual because the recipient's language is
 * unknown at send time.
 * @param {{ inviteUrl: string }} args
 * @returns {{ subject: string, html: string }}
 */
export const buildInviteEmail = ({ inviteUrl }) => {
    const safeUrl = String(inviteUrl).replace(/"/g, '&quot;');
    const subject = 'Your Gym Tracker invitation · Tu invitación a Gym Tracker';
    const html = `<h2>Gym Tracker — Your trainer invited you</h2><p>Your trainer has invited you to Gym Tracker, the app they use to plan and follow your training. Click the button below to create your free account: it will be linked to your trainer automatically.</p><p><em>Tu entrenador te ha invitado a Gym Tracker, la app que usa para planificar y seguir tu entrenamiento. Haz clic en el botón para crear tu cuenta gratuita: quedará vinculada a tu entrenador automáticamente.</em></p><p style="margin:28px 0"><a href="${safeUrl}" style="background-color:#0891b2;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">Create my account · Crear mi cuenta</a></p><p>If you were not expecting this invitation, you can safely ignore this email.<br><em>Si no esperabas esta invitación, puedes ignorar este correo.</em></p>`;
    return { subject, html };
};
