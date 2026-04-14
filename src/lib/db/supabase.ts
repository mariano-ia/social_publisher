import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");

// Server-side client with full privileges. Use this in server actions and API routes.
export function createServerClient(): SupabaseClient {
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_KEY env var");
  return createClient(url!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Client-side client with anon key. Use this only in client components (not used in MVP).
export function createBrowserClient(): SupabaseClient {
  if (!anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY env var");
  return createClient(url!, anonKey);
}

export const ASSETS_BUCKET = "social-publisher-assets";
