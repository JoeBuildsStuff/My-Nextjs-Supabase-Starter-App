import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (!token_hash || !type) {
    redirect('/error')
  }

  const supabase = await createClient()

  // Handle both signup and magic link verification
  if (type === 'signup' || type === 'magiclink') {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.log(`${type}-verification-error:`, error)
      redirect('/error')
    }

    // Successful verification, redirect to the specified URL or home
    redirect(next)
  }

  // If type is neither signup nor magiclink, redirect to error page
  redirect('/error')
}
