import { createClient as createBrowserClient } from "./client";

export async function signUpGuest(email: string, password: string) {
  const supabase = createBrowserClient();
  return supabase.auth.signUp({ email, password });
}

export async function signInGuest(email: string, password: string) {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutGuest() {
  const supabase = createBrowserClient();
  return supabase.auth.signOut();
}

export async function getGuestSession() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}

export async function getGuestUser() {
  const supabase = createBrowserClient();
  return supabase.auth.getUser();
}

export async function resetGuestPassword(email: string) {
  const supabase = createBrowserClient();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/guest/reset-password`,
  });
}
