import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { musicUserPreferences } from '../../../../lib/db/schema';
import { eq } from 'drizzle-orm';

// GET - Get user preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await db
      .select()
      .from(musicUserPreferences)
      .where(eq(musicUserPreferences.userId, user.id));

    if (preferences.length === 0) {
      // Create default preferences
      const [defaultPrefs] = await db
        .insert(musicUserPreferences)
        .values({
          userId: user.id,
          defaultVolume: 80,
          shuffleMode: false,
          repeatMode: 'none',
        })
        .returning();
      return NextResponse.json(defaultPrefs);
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Update user preferences
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { defaultVolume, shuffleMode, repeatMode } = body;

    const [preferences] = await db
      .update(musicUserPreferences)
      .set({
        defaultVolume: defaultVolume !== undefined ? defaultVolume : 80,
        shuffleMode: shuffleMode !== undefined ? shuffleMode : false,
        repeatMode: repeatMode || 'none',
        updatedAt: new Date(),
      })
      .where(eq(musicUserPreferences.userId, user.id))
      .returning();

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}