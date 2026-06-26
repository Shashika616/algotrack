import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; 
import { problems } from '../../../lib/db/schema'; 
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topicId');

  if (!topicId) {
    return NextResponse.json({ error: 'Topic ID parameter is required' }, { status: 400 });
  }

  try {
    const result = await db
      .select()
      .from(problems)
      .where(eq(problems.topicId, topicId)) // 👈 Changed from topic_id to topicId
      .orderBy(problems.title);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Drizzle error fetching problems:", error);
    return NextResponse.json({ error: 'Failed to fetch target problems matrix' }, { status: 500 });
  }
}