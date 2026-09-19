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
 * Change the signed-in user's email. Supabase sends a confirmation link; the
 * change only takes effect once the user confirms it from their inbox.
 *
 * @param {string} newEmail
 * @returns {Promise<{ error: string | null }>}
 */
export async function updateEmail(newEmail) {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
  return { error: error?.message ?? null }
}

/**
 * Change the signed-in user's password.
 *
 * `supabase.auth.updateUser` does NOT verify the current password, so we first
 * re-authenticate with it — otherwise anyone with an open session (e.g. a shared
 * computer) could silently change the password. Only on successful re-auth do we
 * apply the new password.
 *
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ error: string | null }>}
 */
export async function updatePassword(currentPassword, newPassword) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: 'No active session. Please sign in again.' }
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (reauthError) {
    return { error: 'Current password is incorrect.' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: error?.message ?? null }
}

/**
 * Resolve the current session's role without exposing the hidden mapping tables.
 * Returns 'admin', 'org_rep', or null (not signed in / no role).
 *
 * Note: this does NOT call supabase.auth.getSession() — doing so can trigger a
 * token refresh, and if called reactively on every auth event it creates a
 * refresh loop. The RPCs run against the current session automatically (or as
 * anon, in which case they return false/null). Call this only when signed in.
 */
export async function getCurrentRole() {
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) return 'admin'

  const { data: orgId } = await supabase.rpc('get_user_org_id')
  if (orgId) return 'org_rep'

  return null
}
