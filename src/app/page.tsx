import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }
  
  redirect('/workspace')
}