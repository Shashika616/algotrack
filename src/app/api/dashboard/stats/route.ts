import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { and, desc, eq, count, sql } from 'drizzle-orm';
import { db } from '../../../../lib/db'; 
import { userProblemsTracking, problems, topics, dailyLogs } from '../../../../lib/db/schema';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get all user problems with their details
    const userProblems = await db
      .select({
        id: userProblemsTracking.id,
        status: userProblemsTracking.status,
        updatedAt: userProblemsTracking.updatedAt,
        problemId: problems.id,
        problemTitle: problems.title,
        difficulty: problems.difficulty,
        topicId: problems.topicId,
        topicName: topics.name,
      })
      .from(userProblemsTracking)
      .leftJoin(problems, eq(userProblemsTracking.problemId, problems.id))
      .leftJoin(topics, eq(problems.topicId, topics.id))
      .where(eq(userProblemsTracking.userId, userId))
      .orderBy(desc(userProblemsTracking.updatedAt));

    // Get daily logs for streak calculation
    const logs = await db
      .select({
        date: dailyLogs.date,
      })
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.date));

    // Get total topics
    const totalTopicsResult = await db.select({ count: count() }).from(topics);
    const totalTopics = totalTopicsResult[0]?.count || 0;

    // Calculate stats
    const totalSolved = userProblems.filter(p => p.status === 'solved').length;
    const totalAttempted = userProblems.length;
    const successRate = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;

    // Calculate streak
    let streak = 0;
    if (logs.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const uniqueDates = [...new Set(logs.map(l => {
        const d = new Date(l.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }))].sort((a, b) => b - a);

      const todayTime = today.getTime();
      const yesterdayTime = todayTime - 86400000;
      
      if (uniqueDates[0] === todayTime || uniqueDates[0] === yesterdayTime) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
          const expectedDate = new Date(uniqueDates[i-1]);
          expectedDate.setDate(expectedDate.getDate() - 1);
          expectedDate.setHours(0, 0, 0, 0);
          
          if (uniqueDates[i] === expectedDate.getTime()) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // Calculate topics covered
    const topicSet = new Set(userProblems.map(p => p.topicId).filter(Boolean));
    const topicsCovered = topicSet.size;
    const topicsRemaining = Math.max(0, totalTopics - topicsCovered);

    // Get recent problems (last 5)
    const recentProblems = userProblems.slice(0, 5).map(p => ({
      difficulty: p.difficulty || 'Easy',
      name: p.problemTitle || 'Unknown Problem',
      tag: p.topicName || 'Uncategorized',
      status: p.status || 'attempted',
      problemId: p.problemId, 
      topicId: p.topicId, 
    }));

    // Calculate topic breakdown
    // Calculate topic breakdown with IDs
    const topicCounts: Record<string, { 
      label: string; 
      count: number; 
      color: string; 
      topicId: string | null; 
    }> = {};
    const colors = ['#FF6B35', '#10B981', '#64748b', '#94a3b8', '#FF6B35', '#10B981'];
    
    userProblems.forEach(p => {
      if (p.topicName) {
        if (!topicCounts[p.topicName]) {
          topicCounts[p.topicName] = { 
            label: p.topicName, 
            count: 0, 
            color: colors[Object.keys(topicCounts).length % colors.length],
            topicId: p.topicId || null 
          };
        }
        topicCounts[p.topicName].count++;
      }
    });

    const topicBreakdown = Object.values(topicCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map(t => ({
        ...t,
        width: totalSolved > 0 ? `${Math.round((t.count / totalSolved) * 100)}%` : '0%',
      }));

    // Generate activity pattern
    const pattern = generateActivityPattern(logs);

    return NextResponse.json({
      totalSolved,
      streak,
      successRate,
      topicsCovered,
      topicsRemaining,
      recentProblems,
      topicBreakdown,
      pattern,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateActivityPattern(logs: any[]) {
  const pattern = [];
  const now = new Date();
  
  for (let i = 83; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const hasActivity = logs.some(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === date.getTime();
    });
    
    // Weight based on activity presence (0-4)
    const weight = hasActivity ? Math.floor(Math.random() * 4) + 1 : 0;
    pattern.push(weight);
  }
  
  return pattern;
}