# EmailJS Setup Guide

This guide will help you set up EmailJS for the feedback feature in the Gym Tracker app.

## Step 1: Create EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month)

## Step 2: Add Email Service

1. In your EmailJS dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the connection instructions
5. Save your **Service ID** (looks like: `service_xxxxxxx`)

## Step 3: Create Email Template

1. Go to "Email Templates"
2. Click "Create New Template"
3. Set up your template:

**Subject:**
```
Gym Tracker Feedback from {{from_name}}
```

**Content:**
```
You have received feedback from the Gym Tracker App:

Name: {{from_name}}
Email: {{from_email}}

Message:
{{message}}

---
This email was sent from your Gym Tracker portfolio app.
```

4. In the "To email" field, put your email address: `{{to_email}}`
5. Save and note your **Template ID** (looks like: `template_xxxxxxx`)

## Step 4: Get Your Public Key

1. Go to "Account" > "API Keys"
2. Copy your **Public Key**

## Step 5: Configure the App

1. Copy `.env.example` to `.env`
2. Update with your values:

```env
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
```

## Step 6: Update Email Address

In `src/components/FeedbackModal.jsx`, update line 44:
```javascript
to_email: 'your-email@example.com', // Replace with your email
```

## Security Notes

- Never commit your `.env` file to git
- The public key is safe to expose in frontend code
- For production, consider rate limiting and spam protection

## Testing

1. Start your dev server: `npm run dev`
2. Click "Send Feedback" button
3. Fill out the form
4. Check your email inbox

## Troubleshooting

- Make sure all environment variables are set correctly
- Check EmailJS dashboard for failed emails
- Verify your email service is properly connected
- Check browser console for errors