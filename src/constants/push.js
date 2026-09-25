// Public half of the VAPID key pair the rest-timer-push function signs with.
// Public by design (browsers need it to subscribe); the private half is a
// Supabase secret. Rotating the pair means updating both; devices holding a
// subscription for the old key resubscribe on their next rest (restPush.js).
export const VAPID_PUBLIC_KEY = 'BIPtERN1snNwmqlxaMXV2K5T8CxSOnRH03yjM35Sk7CT207Joa6WxCZnViDZ4v8ZzP5rYne6hah6VxH2QEtQ7iE';
