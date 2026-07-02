import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { musicPlaylists, musicTracks } from '../../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET - Fetch all playlists for the current user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlists = await db
      .select()
      .from(musicPlaylists)
      .where(eq(musicPlaylists.userId, user.id))
      .orderBy(desc(musicPlaylists.createdAt));

    // Get track count for each playlist
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        const tracks = await db
          .select()
          .from(musicTracks)
          .where(eq(musicTracks.playlistId, playlist.id));
        
        return {
          ...playlist,
          trackCount: tracks.length,
          tracks: tracks,
        };
      })
    );

    return NextResponse.json(playlistsWithCounts);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Create a new playlist
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPublic } = body;

    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const [playlist] = await db
      .insert(musicPlaylists)
      .values({
        userId: user.id,
        name,
        description: description || '',
        isPublic: isPublic || false,
      })
      .returning();

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE - Delete a playlist
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('id');

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    // First verify the playlist belongs to the user
    const existing = await db
      .select()
      .from(musicPlaylists)
      .where(
        and(
          eq(musicPlaylists.id, playlistId),
          eq(musicPlaylists.userId, user.id)
        )
      );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Delete the playlist (tracks will be cascade deleted)
    await db
      .delete(musicPlaylists)
      .where(eq(musicPlaylists.id, playlistId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}