'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/utils/supabase/server'

// Add schema definition at the top
const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function login(formData: FormData) {
  const supabase = await createClient()

  // Parse and validate the input
  const result = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    console.log("validation-error", result.error)
    redirect('/error')
  }

  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    console.log("login-error", error)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Parse and validate the input
  const result = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    console.log("validation-error", result.error)
    redirect('/error')
  }

  const { error } = await supabase.auth.signUp(result.data)

  if (error) {
    console.log("signup-error", error)
    redirect('/error')
  }

  // Redirect to verify email page
  revalidatePath('/', 'layout')
  redirect('/verify-email')
}

export async function signInWithGoogle() {
  'use server'

  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })

  if (error) {
    console.log("google-signin-error", error)
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url)
  }

  revalidatePath('/', 'layout')
}

export async function signInWithGithub() {
  'use server'
  
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })

  if (error) {
    console.log("github-signin-error", error)
    redirect('/error')
  }

  if (data.url) {
    redirect(data.url)
  }

  revalidatePath('/', 'layout')
}