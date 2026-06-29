import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { eq, sql } from 'drizzle-orm';
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

    const topicBreakdown = await db
      .select({
        topicId: topics.id,
        topicName: topics.name,
        count: sql<number>`count(${userProblemsTracking.id})`,
      })
      .from(userProblemsTracking)
      .leftJoin(problems, eq(userProblemsTracking.problemId, problems.id))
      .leftJoin(topics, eq(problems.topicId, topics.id))
      .where(eq(userProblemsTracking.userId, userId))
      .groupBy(topics.id, topics.name)
      .orderBy(sql`count(${userProblemsTracking.id}) DESC`);

    const colors = ['#FF6B35', '#10B981', '#64748b', '#94a3b8', '#FF6B35', '#10B981'];
    const total = topicBreakdown.reduce((acc, t) => acc + Number(t.count), 0);

    return NextResponse.json(
      topicBreakdown.map((t, i) => ({
        label: t.topicName || 'Uncategorized',
        count: Number(t.count),
        width: total > 0 ? `${Math.round((Number(t.count) / total) * 100)}%` : '0%',
        color: colors[i % colors.length],
      }))
    );

  } catch (error) {
    console.error('Topic breakdown error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}