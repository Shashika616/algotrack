import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db'; //  Relative fallback path
import { solutionPanels } from '../../../../lib/db/schema'; //  Relative fallback path
import { and, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { problemId, language, codeContent, whiteboardData, timeComplexity, spaceComplexity } = body;

    if (!problemId || !language) {
      return NextResponse.json({ error: 'Missing problemId or language parameters' }, { status: 400 });
    }

    const existingPanel = await db
      .select()
      .from(solutionPanels)
      .where(
        and(
          eq(solutionPanels.problemId, problemId),
          eq(solutionPanels.language, language)
        )
      )
      .limit(1);

    if (existingPanel.length > 0) {
      await db
        .update(solutionPanels)
        .set({
          codeContent: codeContent ?? existingPanel[0].codeContent,
          whiteboardData: whiteboardData ?? existingPanel[0].whiteboardData,
          timeComplexity: timeComplexity ?? existingPanel[0].timeComplexity,
          spaceComplexity: spaceComplexity ?? existingPanel[0].spaceComplexity,
        })
        .where(eq(solutionPanels.id, existingPanel[0].id));

      return NextResponse.json({ message: 'Workspace buffer updated successfully', id: existingPanel[0].id });
    } else {
      const newPanel = await db
        .insert(solutionPanels)
        .values({
          problemId,
          language,
          codeContent: codeContent ?? '',
          whiteboardData: whiteboardData ?? {},
          timeComplexity: timeComplexity ?? null,
          spaceComplexity: spaceComplexity ?? null,
        })
        .returning({ id: solutionPanels.id });

      return NextResponse.json({ message: 'Created new language node record', id: newPanel[0].id });
    }
  } catch (error) {
    console.error('Drizzle save transaction failure:', error);
    return NextResponse.json({ error: 'Internal server saving configuration error' }, { status: 500 });
  }
}