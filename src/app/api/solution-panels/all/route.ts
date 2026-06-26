import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { solutionPanels, problems } from '../../../../lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Join solution panels with their corresponding problems to fetch titles dynamically
    const results = await db
      .select({
        id: solutionPanels.id,
        problemTitle: problems.title,
        language: solutionPanels.language,
        codeContent: solutionPanels.codeContent,
        timeComplexity: solutionPanels.timeComplexity,
        spaceComplexity: solutionPanels.spaceComplexity,
        createdAt: solutionPanels.createdAt
      })
      .from(solutionPanels)
      .innerJoin(problems, eq(solutionPanels.problemId, problems.id))
      .orderBy(desc(solutionPanels.createdAt));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed fetching solutions vault portfolio records:", error);
    return NextResponse.json({ error: 'Database pipeline query error' }, { status: 500 });
  }
}