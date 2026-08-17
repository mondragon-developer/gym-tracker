// Supabase Edge Function: send-invite
//
// Lets a signed-in trainer (or admin) email their client-invite link to a
// client directly from the app. Browsers cannot send email, so the app calls
// this function, which:
//   1. authenticates the caller from their JWT,
//   2. confirms via the service role that the caller is a trainer/admin and
//      reads THEIR invite code (the URL is built server-side, never taken
//      from the request, so callers cannot send arbitrary links),
//   3. sends the bilingual invite email through the Brevo transactional API.
//
// Required secrets (supabase secrets set ...):
//   BREVO_API_KEY   Brevo API v3 key (xkeysib-..., NOT the SMTP key)
//   SENDER_EMAIL    a sender verified in Brevo (e.g. the Gym Tracker sender)
//   APP_URL         https://gymworkoutjm.vercel.app
// Optional:
//   SENDER_NAME     defaults to "Gym Tracker"
//
// See README.md in this folder for full deploy steps.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { isValidEmail, buildInviteUrl, buildInviteEmail } from './inviteEmail.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL');
  const SENDER_NAME = Deno.env.get('SENDER_NAME') ?? 'Gym Tracker';
  const APP_URL = Deno.env.get('APP_URL');
  if (!BREVO_API_KEY || !SENDER_EMAIL || !APP_URL) {
    return json(500, { error: 'Function is not configured (missing secrets)' });
  }

  // 1. Caller identity from their JWT.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'Missing authorization' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anon = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await anon.auth.getUser();
  if (userError || !user) return json(401, { error: 'Invalid session' });

  // 2. Only trainers/admins send client invites, and only with their own code.
  const service = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: profile } = await service
    .from('profiles')
    .select('role, invite_code')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'admin')) {
    return json(403, { error: 'Only trainers can send invitations' });
  }
  if (!profile.invite_code) {
    return json(400, { error: 'Your account has no invite code yet' });
  }

  // 3. Validate input and build the email.
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').trim();
  } catch {
    return json(400, { error: 'Invalid request body' });
  }
  if (!isValidEmail(email)) return json(400, { error: 'Invalid email address' });

  const inviteUrl = buildInviteUrl(APP_URL, profile.invite_code);
  const { subject, html } = buildInviteEmail({ inviteUrl });

  // 4. Send via Brevo.
  const brevo = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email }],
      subject,
      htmlContent: html,
    }),
  });

  if (!brevo.ok) {
    const detail = await brevo.text();
    return json(502, { error: `Email provider rejected the send (${brevo.status})`, detail });
  }
  return json(200, { sent: true });
});
