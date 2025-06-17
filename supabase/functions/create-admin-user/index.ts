
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if admin user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const adminExists = existingUser?.users?.some(user => 
      user.email === 'admin@smarttasker.ai'
    )

    if (adminExists) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists',
          email: 'admin@smarttasker.ai'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@smarttasker.ai',
      password: 'admin123',
      user_metadata: {
        name: 'System Administrator'
      },
      email_confirm: true
    })

    if (userError) {
      console.error('Error creating admin user:', userError)
      throw userError
    }

    // Update the profile with admin role
    if (userData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          name: 'System Administrator'
        })
        .eq('id', userData.user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        // Don't throw here as user is created, just log the error
      }
    }

    console.log('Admin user created successfully:', userData.user?.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        email: 'admin@smarttasker.ai',
        password: 'admin123',
        user: userData.user
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-admin-user function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
