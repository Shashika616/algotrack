import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { solutionPanels, userProblemsTracking } from '../../../../lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problemId, language, codeContent, timeComplexity, spaceComplexity, status } = body;

    // Check if a solution with this language already exists for this user and problem
    const existing = await db
      .select()
      .from(solutionPanels)
      .where(
        and(
          eq(solutionPanels.problemId, problemId),
          eq(solutionPanels.userId, user.id),
          eq(solutionPanels.language, language)
        )
      );

    let solutionResult;
    if (existing.length > 0) {
      // Update existing solution
      solutionResult = await db
        .update(solutionPanels)
        .set({
          codeContent,
          timeComplexity,
          spaceComplexity,
        })
        .where(
          and(
            eq(solutionPanels.problemId, problemId),
            eq(solutionPanels.userId, user.id),
            eq(solutionPanels.language, language)
          )
        )
        .returning();
    } else {
      // Insert new solution
      solutionResult = await db
        .insert(solutionPanels)
        .values({
          problemId,
          userId: user.id,
          language,
          codeContent,
          timeComplexity,
          spaceComplexity,
          createdAt: new Date(),
        })
        .returning();
    }

    // Update or insert into user_problems_tracking
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
      // Update existing with status if provided, otherwise keep current status
      await db
        .update(userProblemsTracking)
        .set({
          status: status || existingTracking[0].status,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userProblemsTracking.userId, user.id),
            eq(userProblemsTracking.problemId, problemId)
          )
        );
    } else {
      // Insert new with provided status or default to 'attempted'
      await db
        .insert(userProblemsTracking)
        .values({
          userId: user.id,
          problemId,
          status: status || 'attempted',
          updatedAt: new Date(),
        });
    }

    return NextResponse.json({ 
      success: true, 
      data: solutionResult[0],
      message: 'Solution saved successfully'
    });
  } catch (error) {
    console.error('Error saving solution:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}