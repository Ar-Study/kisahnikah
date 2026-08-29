// src/lib/supabaseClient.js - Supabase Client initialization using .env credentials
import { createClient } from '@supabase/supabase-js';

// Default credentials from .env
const SUPABASE_URL =
	(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL) ||
	'https://zbwivkhimowvrmwdexfc.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
	(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
	'sb_publishable_XADR0ndsPT1gEjC7rtHP6w_ocDTppfP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
		detectSessionInUrl: true
	}
});

/**
 * Helper to check if Supabase is properly configured
 */
export function isSupabaseReady() {
	return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
