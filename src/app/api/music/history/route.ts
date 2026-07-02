import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { listeningHistory, musicTracks } from '../../../../lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm'; // Add sql import

// POST - Log listening history
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, playlistId, progress, completed } = body;

    await db.insert(listeningHistory).values({
      userId: user.id,
      trackId,
      playlistId: playlistId || null,
      progress: Math.round(progress || 0),
      completed: completed || false,
    });

    // Update play count - use sql from drizzle-orm
    await db
      .update(musicTracks)
      .set({
        playCount: sql`${musicTracks.playCount} + 1`,
      })
      .where(eq(musicTracks.id, trackId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - Get listening history
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await db
      .select()
      .from(listeningHistory)
      .where(eq(listeningHistory.userId, user.id))
      .orderBy(desc(listeningHistory.playedAt))
      .limit(50);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}