import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { eq, and } from 'drizzle-orm';
import { db } from '../../../../lib/db';
import { problems, topics, solutionPanels } from '../../../../lib/db/schema';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    const topicId = searchParams.get('topicId');

    const result: {
      problem?: any;
      topic?: any;
      solutions?: any[];
      problems?: any[];
    } = {};

    // If problemId is provided, fetch the problem and its solutions
    if (problemId) {
      // Fetch the problem with its topic
      const problemData = await db
        .select({
          id: problems.id,
          title: problems.title,
          difficulty: problems.difficulty,
          description: problems.description,
          examples: problems.examples,
          topicId: problems.topicId,
          topicName: topics.name,
        })
        .from(problems)
        .leftJoin(topics, eq(problems.topicId, topics.id))
        .where(eq(problems.id, problemId));

      if (problemData.length > 0) {
        result.problem = problemData[0];
        
        // Fetch solutions for this problem
        const solutions = await db
          .select()
          .from(solutionPanels)
          .where(
            and(
              eq(solutionPanels.problemId, problemId),
              eq(solutionPanels.userId, user.id)
            )
          );
        
        result.solutions = solutions;
      }
    }

    // If topicId is provided, fetch the topic
    if (topicId) {
      const topicData = await db
        .select()
        .from(topics)
        .where(eq(topics.id, topicId));

      if (topicData.length > 0) {
        result.topic = topicData[0];
        
        // Also fetch problems for this topic if no specific problem was requested
        if (!problemId) {
          const topicProblems = await db
            .select()
            .from(problems)
            .where(eq(problems.topicId, topicId));
          
          result.problems = topicProblems;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Navigation data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}