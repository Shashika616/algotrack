'use server';

import { db } from '../lib/db';
import { problems } from '../lib/db/schema';
import { createClient } from '../lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function logProblem(formData: FormData) {
  const supabase = await createClient();
  
  // Get the logged-in user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized access. Please log in.');
  }

  const title = formData.get('title') as string;
  const topic = formData.get('topic') as string;
  const difficulty = formData.get('difficulty') as 'easy' | 'medium' | 'hard';
  const status = formData.get('status') as 'solved' | 'attempted' | 'reviewed';
  const notes = formData.get('notes') as string;
  const timeTakenStr = formData.get('timeTaken') as string;
  const url = formData.get('url') as string;

  if (!title || !topic) {
    throw new Error('Title and Topic fields are required.');
  }

  // Insert problem mapping it to the authenticated profile ID
  await db.insert(problems).values({
    userId: user.id,
    title,
    topic,
    difficulty,
    status,
    notes,
    url: url || null,
    timeTaken: timeTakenStr ? parseInt(timeTakenStr, 10) : null,
  });

  // Purge the cache and send them back to the dashboard
  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();
  const origin = (await headers()).get('origin');

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Redirect to login showing check email notification
  redirect('/login?message=Check your email to confirm your account.');
}