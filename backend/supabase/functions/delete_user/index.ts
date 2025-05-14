// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // 1. Authenticate user via JWT
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  })

  // Get the JWT from the Authorization header
  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace('Bearer ', '')

  // Validate JWT and get user id
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }
  const userId = user.id

  // 2. Delete from tasks and profiles
  const { error: tasksError } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', userId)
  if (tasksError) {
    return new Response(JSON.stringify({ error: 'Failed to delete tasks' }), { status: 500, headers: corsHeaders })
  }

  const { error: profilesError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  if (profilesError) {
    return new Response(JSON.stringify({ error: 'Failed to delete profile' }), { status: 500, headers: corsHeaders })
  }

  // 3. Delete from auth.users (Supabase Admin API)
  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    }
  })

  if (!adminRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to delete auth user' }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
})
