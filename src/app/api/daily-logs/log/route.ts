import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { dailyLogs } from '../../../../lib/db/schema';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summary, mood } = body;

    const result = await db
      .insert(dailyLogs)
      .values({
        userId: user.id,
        date: new Date(),
        summary: summary || 'Daily activity',
        mood: mood || 3,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      data: result[0],
      message: 'Daily activity logged successfully'
    });
  } catch (error) {
    console.error('Error logging daily activity:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal Server Error' 
    }, { status: 500 });
  }
}