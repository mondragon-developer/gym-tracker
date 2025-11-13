# Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication and database for your Gym Tracker app.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your app deployed on Vercel (or running locally)

## 🚀 Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `gym-tracker` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect to start
4. Click **"Create new project"**
5. Wait ~2 minutes for your project to be provisioned

## 🔑 Step 2: Get Your API Keys

1. In your Supabase project dashboard, click **Settings** (⚙️ icon in sidebar)
2. Click **API** in the settings menu
3. You'll need two values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

## 🗄️ Step 3: Create Database Tables

1. In your Supabase dashboard, click **SQL Editor** in the sidebar
2. Click **"New Query"**
3. Copy and paste the following SQL:

```sql
-- Create workout_plans table
CREATE TABLE workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preferences JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_plans
CREATE POLICY "Users can view their own workout plans"
  ON workout_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout plans"
  ON workout_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans"
  ON workout_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans"
  ON workout_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX workout_plans_user_id_idx ON workout_plans(user_id);
CREATE INDEX user_preferences_user_id_idx ON user_preferences(user_id);
```

4. Click **"Run"** to execute the SQL
5. You should see a success message

## ✉️ Step 4: Configure Email Authentication

1. In your Supabase dashboard, click **Authentication** in the sidebar
2. Click **Providers**
3. Find **Email** and make sure it's enabled (it should be by default)
4. **Important**: Configure your email settings:
   - Click **Settings** under Authentication
   - Scroll to **Email Templates**
   - Customize confirmation email if desired
   - For production, set up a custom SMTP provider (optional but recommended)

## 🔧 Step 5: Add Environment Variables to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and open your project
2. Click **Settings** tab
3. Click **Environment Variables** in the sidebar
4. Add the following variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL (from Step 2) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key (from Step 2) |

5. Make sure to select **all environments** (Production, Preview, Development)
6. Click **Save**

### Option B: Via Vercel CLI

```bash
vercel env add VITE_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your Supabase anon key when prompted
```

## 🏠 Step 6: Local Development Setup

1. Create a `.env` file in your project root (copy from `.env.example`):

```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key-here
```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## 🚢 Step 7: Deploy to Vercel

After adding the environment variables:

```bash
git add .
git commit -m "feat: add Supabase authentication"
git push origin main
```

Vercel will automatically deploy your changes with the new environment variables.

## ✅ Step 8: Test Your Setup

1. Visit your deployed app on Vercel
2. Try creating a new account
3. Check your email for the confirmation link
4. Click the confirmation link
5. Sign in with your new account
6. Your workouts should now be saved to the cloud!

## 🔍 Verify Database

To verify data is being saved:

1. Go to your Supabase dashboard
2. Click **Table Editor** in the sidebar
3. Select **workout_plans** table
4. You should see your workout data after using the app

## 🎨 Customize Email Templates (Optional)

1. In Supabase dashboard, go to **Authentication** > **Email Templates**
2. You can customize:
   - Confirmation email
   - Password reset email
   - Magic link email
3. Use the template editor to match your brand

## 🔐 Security Notes

- ✅ Row Level Security (RLS) is enabled - users can only access their own data
- ✅ The `anon` key is safe to expose in client-side code
- ✅ Never share your `service_role` key (not used in this app)
- ✅ Always use HTTPS in production (Vercel does this automatically)

## 🐛 Troubleshooting

### "Invalid API key" error
- Double-check your environment variables in Vercel
- Make sure you're using the **anon/public** key, not the service_role key
- Redeploy after adding environment variables

### Users not receiving confirmation emails
- Check Supabase **Authentication** > **Email** settings
- For production, set up a custom SMTP provider
- Check spam folder

### Data not saving
- Open browser console and check for errors
- Verify the SQL was executed successfully in Step 3
- Check Supabase **Table Editor** to see if tables exist

### "Failed to fetch" errors
- Check that your Supabase project URL is correct
- Verify the project is not paused (free tier auto-pauses after 1 week of inactivity)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎉 You're Done!

Your gym tracker now has full authentication and cloud storage! Users can:
- ✅ Sign up and sign in
- ✅ Save workout progress to the cloud
- ✅ Access their data from any device
- ✅ Keep their data private and secure

If you have any issues, check the troubleshooting section or open an issue in the GitHub repository.
