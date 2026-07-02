import { NextRequest, NextResponse } from 'next/server';
// Cleaned up imports using your working path alias!
import { createClient } from '../../../../../../lib/supabase/server';
import { db } from '../../../../../../lib/db';
import { musicTracks } from '../../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 1. Used NextRequest for standard typing consistency
// 2. Swapped the inline params type for your RouteParams interface
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. This await is now safe and properly typed!
    const { id } = await params;
    const body = await request.json();
    const { duration } = body;

    if (!duration || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
    }

    // Verify track belongs to user
    const trackCheck = await db
      .select()
      .from(musicTracks)
      .where(
        and(
          eq(musicTracks.id, id),
          eq(musicTracks.userId, user.id)
        )
      );

    if (trackCheck.length === 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Update duration
    const [updatedTrack] = await db
      .update(musicTracks)
      .set({ duration: Math.round(duration) })
      .where(eq(musicTracks.id, id))
      .returning();

    return NextResponse.json(updatedTrack);
  } catch (error) {
    console.error('Error updating track duration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}