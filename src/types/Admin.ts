export type UserRole = 'user' | 'admin';

/** A row from the public.profiles table, as the admin dashboard sees it. */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}
