import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; //  Relative fallback path
import { solutionPanels } from '../../../lib/db/schema'; //  Relative fallback path
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const problemId = searchParams.get('problemId');

  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID parameters required' }, { status: 400 });
  }

  try {
    const panelsList = await db
      .select()
      .from(solutionPanels)
      .where(eq(solutionPanels.problemId, problemId));

    return NextResponse.json(panelsList);
  } catch (error) {
    console.error('Error fetching solution panels:', error);
    return NextResponse.json({ error: 'Database reading transaction failure' }, { status: 500 });
  }
}