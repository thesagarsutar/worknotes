import { supabase } from './supabaseClient'

export async function deleteUserAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Adjust the URL if needed for your deployment
  const res = await fetch('/functions/v1/delete_user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete account')
  }

  return true
}
