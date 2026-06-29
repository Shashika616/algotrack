import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../../../lib/db'; 
import { userProblemsTracking, problems, topics } from '../../../../lib/db/schema';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const recentProblems = await db
      .select({
        id: userProblemsTracking.id,
        status: userProblemsTracking.status,
        updatedAt: userProblemsTracking.updatedAt,
        problemId: problems.id,
        problemTitle: problems.title,
        difficulty: problems.difficulty,
        topicName: topics.name,
      })
      .from(userProblemsTracking)
      .leftJoin(problems, eq(userProblemsTracking.problemId, problems.id))
      .leftJoin(topics, eq(problems.topicId, topics.id))
      .where(eq(userProblemsTracking.userId, userId))
      .orderBy(desc(userProblemsTracking.updatedAt))
      .limit(5);

    return NextResponse.json(recentProblems);

  } catch (error) {
    console.error('Recent problems error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}