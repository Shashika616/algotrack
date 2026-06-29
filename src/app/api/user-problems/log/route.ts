import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { userProblemsTracking, dailyLogs } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problemId, status, timeTaken, notes } = body;

    // Validate status
    if (!['solved', 'attempted', 'reviewed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if entry exists
    const existing = await db
      .select()
      .from(userProblemsTracking)
      .where(
        and(
          eq(userProblemsTracking.userId, user.id),
          eq(userProblemsTracking.problemId, problemId)
        )
      );

    let result;
    if (existing.length > 0) {
      // Update existing
      result = await db
        .update(userProblemsTracking)
        .set({
          status,
          timeTaken: timeTaken || existing[0].timeTaken,
          notes: notes || existing[0].notes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userProblemsTracking.userId, user.id),
            eq(userProblemsTracking.problemId, problemId)
          )
        )
        .returning();
    } else {
      // Insert new
      result = await db
        .insert(userProblemsTracking)
        .values({
          userId: user.id,
          problemId,
          status,
          timeTaken,
          notes,
          updatedAt: new Date(),
        })
        .returning();
    }

    // Log daily activity
    await db
      .insert(dailyLogs)
      .values({
        userId: user.id,
        date: new Date(),
        summary: `Worked on problem`,
        mood: status === 'solved' ? 5 : status === 'reviewed' ? 4 : 3,
      });

    return NextResponse.json({ 
      success: true, 
      data: result[0],
      message: 'Problem activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging problem:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}