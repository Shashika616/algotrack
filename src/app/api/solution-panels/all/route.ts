import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { solutionPanels, problems } from '../../../../lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const solutions = await db
      .select({
        id: solutionPanels.id,
        problemTitle: problems.title,
        language: solutionPanels.language,
        codeContent: solutionPanels.codeContent,
        timeComplexity: solutionPanels.timeComplexity,
        spaceComplexity: solutionPanels.spaceComplexity,
        createdAt: solutionPanels.createdAt,
      })
      .from(solutionPanels)
      .leftJoin(problems, eq(solutionPanels.problemId, problems.id))
      .where(eq(solutionPanels.userId, user.id))
      .orderBy(desc(solutionPanels.createdAt));

    return NextResponse.json(solutions);
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}