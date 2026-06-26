'use server';

import { db } from '../lib/db';
import { userProblemsTracking } from '../lib/db/schema';
import { createClient } from '../lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';

export async function logProblem(formData: FormData) {
  const supabase = await createClient();
  
  // Get the logged-in user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized access. Please log in.');
  }

  // The hidden field or reference field containing the global problem row ID
  const problemId = formData.get('problemId') as string;
  const status = formData.get('status') as 'solved' | 'attempted' | 'reviewed';
  const notes = formData.get('notes') as string;
  const timeTakenStr = formData.get('timeTaken') as string;
  const url = formData.get('url') as string;

  if (!problemId) {
    throw new Error('Problem selection references are required.');
  }

  const timeTaken = timeTakenStr ? parseInt(timeTakenStr, 10) : null;

  // Check if a tracking entry already exists for this user and problem
  const existingTracking = await db
    .select()
    .from(userProblemsTracking)
    .where(
      and(
        eq(userProblemsTracking.userId, user.id),
        eq(userProblemsTracking.problemId, problemId)
      )
    );

  if (existingTracking.length > 0) {
    // Update existing record
    await db
      .update(userProblemsTracking)
      .set({
        status,
        notes,
        url: url || null,
        timeTaken,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userProblemsTracking.userId, user.id),
          eq(userProblemsTracking.problemId, problemId)
        )
      );
  } else {
    // Create new tracking milestone record
    await db.insert(userProblemsTracking).values({
      userId: user.id,
      problemId: problemId,
      status: status || 'attempted',
      notes,
      url: url || null,
      timeTaken,
    });
  }

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

  redirect('/login?message=Check your email to confirm your account.');
}