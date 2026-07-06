# Supabase Auth Email Templates

Configured in: Dashboard → Authentication → Emails → Templates
(project `dtzovlvgmymlptprdxcz`). This file documents the live values so the
dashboard config is reproducible; editing this file does NOT change the emails.

Both templates are bilingual (EN + ES) because the app ships both languages
and the email is sent before we know the user's language preference.

Note: the sender ("Supabase Auth <noreply@mail.app.supabase.io>") can only be
changed by enabling custom SMTP (Authentication → Emails → SMTP Settings).
The built-in email service is rate-limited and not meant for production scale.

---

## Reset password

**Subject:** `Reset your Gym Tracker password · Restablece tu contraseña`

**Body:**

```html
<h2>Gym Tracker — Reset your password</h2><p>We received a request to reset the password for your Gym Tracker account. Click the button below to choose a new password.</p><p><em>Recibimos una solicitud para restablecer la contraseña de tu cuenta de Gym Tracker. Haz clic en el botón para elegir una nueva contraseña.</em></p><p style="margin:28px 0"><a href="{{ .ConfirmationURL }}" style="background-color:#0891b2;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">Reset password · Restablecer contraseña</a></p><p>If you didn't request this, you can safely ignore this email.<br><em>Si no solicitaste este cambio, puedes ignorar este correo.</em></p>
```

## Confirm sign up

**Subject:** `Welcome to Gym Tracker — Confirm your email · Confirma tu correo`

**Body:**

```html
<h2>Gym Tracker — Confirm your email</h2><p>Welcome! Click the button below to confirm your email address and activate your Gym Tracker account.</p><p><em>¡Bienvenido! Haz clic en el botón para confirmar tu correo y activar tu cuenta de Gym Tracker.</em></p><p style="margin:28px 0"><a href="{{ .ConfirmationURL }}" style="background-color:#0891b2;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">Confirm email · Confirmar correo</a></p><p>If you didn't create this account, you can safely ignore this email.<br><em>Si no creaste esta cuenta, puedes ignorar este correo.</em></p>
```
