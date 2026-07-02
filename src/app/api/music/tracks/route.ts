import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { musicTracks, musicPlaylists, listeningHistory } from '../../../../lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const maxDuration = 30; 

// GET - Fetch tracks for a playlist or all tracks
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');
    const trackId = searchParams.get('trackId');

    // Get specific track
    if (trackId) {
      const track = await db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.id, trackId),
            eq(musicTracks.userId, user.id)
          )
        );
      
      if (track.length === 0) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }
      
      return NextResponse.json(track[0]);
    }

    // Get tracks for a playlist
    if (playlistId) {
      // Verify playlist belongs to user
      const playlist = await db
        .select()
        .from(musicPlaylists)
        .where(
          and(
            eq(musicPlaylists.id, playlistId),
            eq(musicPlaylists.userId, user.id)
          )
        );

      if (playlist.length === 0) {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      }

      const tracks = await db
        .select()
        .from(musicTracks)
        .where(
          and(
            eq(musicTracks.playlistId, playlistId),
            eq(musicTracks.userId, user.id)
          )
        )
        .orderBy(desc(musicTracks.createdAt));

      return NextResponse.json(tracks);
    }

    // Get all tracks
    const tracks = await db
      .select()
      .from(musicTracks)
      .where(eq(musicTracks.userId, user.id))
      .orderBy(desc(musicTracks.createdAt));

    return NextResponse.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - Upload a new track
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;
    const playlistId = formData.get('playlistId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    // Verify playlist belongs to user
    const playlist = await db
      .select()
      .from(musicPlaylists)
      .where(
        and(
          eq(musicPlaylists.id, playlistId),
          eq(musicPlaylists.userId, user.id)
        )
      );

    if (playlist.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    
    // Convert file to buffer for upload
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage with chunked upload for large files
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'audio/mpeg',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Check if it's a size limit error
      if (uploadError.message.includes('too large')) {
        return NextResponse.json({ error: 'File too large for storage. Maximum size is 50MB.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to upload file: ' + uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('music')
      .getPublicUrl(fileName);

    // Get audio duration
    let duration = 0;
    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          duration = audio.duration;
          URL.revokeObjectURL(url);
          resolve(null);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(null);
        };
        // Fallback if metadata loading takes too long
        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve(null);
        }, 5000);
      });
    } catch (err) {
      console.warn('Could not get audio duration:', err);
      duration = 0;
    }

    // Save track to database
    const [track] = await db
      .insert(musicTracks)
      .values({
        userId: user.id,
        playlistId,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        artist: artist || 'Unknown Artist',
        fileUrl: publicUrl,
        duration: Math.round(duration),
        fileSize: file.size,
        fileFormat: fileExt || 'unknown',
      })
      .returning();

    // Log to listening history
    await db.insert(listeningHistory).values({
      userId: user.id,
      trackId: track.id,
      playlistId,
      completed: false,
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error uploading track:', error);
    return NextResponse.json({ error: 'Internal Server Error: ' + (error as Error).message }, { status: 500 });
  }
}

// DELETE - Delete a track
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('id');

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Verify track belongs to user
    const track = await db
      .select()
      .from(musicTracks)
      .where(
        and(
          eq(musicTracks.id, trackId),
          eq(musicTracks.userId, user.id)
        )
      );

    if (track.length === 0) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Delete from storage - extract file path from URL
    const fileUrl = track[0].fileUrl;
    const filePath = fileUrl.split('/').pop();
    if (filePath) {
      await supabase.storage
        .from('music')
        .remove([filePath]);
    }

    // Delete from database (cascade will handle listening history)
    await db
      .delete(musicTracks)
      .where(eq(musicTracks.id, trackId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting track:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}