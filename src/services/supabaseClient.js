import { createClient } from '@supabase/supabase-js'

const viteEnv = import.meta.env ?? {}
const supabaseUrl = viteEnv.VITE_SUPABASE_URL?.trim()
const publishableKey = viteEnv.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (Boolean(supabaseUrl) !== Boolean(publishableKey)) {
  throw new Error(
    'Configure both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable Supabase.',
  )
}

export const supabaseEnabled = Boolean(supabaseUrl && publishableKey)

export const supabase = supabaseEnabled
  ? createClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'JobKhoj cannot access its Supabase job database. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in this environment, then restart the Vite server or rebuild the app. Mock jobs are not used as a persistence fallback.',
    )
  }

  return supabase
}
