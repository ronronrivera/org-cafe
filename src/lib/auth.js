import { supabase } from './supabaseClient'

/**
 * Sign in an administrator (LCO/OSAS).
 *
 * Both admins and org_reps use the same Supabase Auth email/password login;
 * the admin role is verified server-side via the `is_admin()` SECURITY DEFINER
 * function (see supabase/migrations/..._create_rls_policies.sql). The `admins`
 * table itself is hidden from the API, so we must go through the RPC.
 *
 * If the signed-in user is not an admin, the session is immediately revoked so
 * a non-admin can never hold an "admin" session.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: import('@supabase/supabase-js').User | null, error: string | null }>}
 */
export async function signInAsAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    return { user: null, error: error.message }
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin')

  if (rpcError) {
    await supabase.auth.signOut()
    return { user: null, error: 'Could not verify admin privileges. Please try again.' }
  }

  if (!isAdmin) {
    await supabase.auth.signOut()
    return { user: null, error: 'This account does not have administrator access.' }
  }

  return { user: data.user, error: null }
}

/**
 * Sign the current user out.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}

/**
 * Resolve the current session's role without exposing the hidden mapping tables.
 * Returns 'admin', 'org_rep', or null (not signed in / no role).
 */
export async function getCurrentRole() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) return 'admin'

  const { data: orgId } = await supabase.rpc('get_user_org_id')
  if (orgId) return 'org_rep'

  return null
}
