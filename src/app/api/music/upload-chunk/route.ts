import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { musicTracks, musicPlaylists, listeningHistory } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Increase timeout to 5 minutes for large uploads
export const maxDuration = 300;

// Sanitize filename - remove special characters
const sanitizeFileName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9.\s-]/g, '')
    .replace(/\s+/g, '_')
    .trim();
};

// Initialize upload - creates a temporary upload session
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const fileName = formData.get('fileName') as string;
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileSize = parseInt(formData.get('fileSize') as string);

    if (!fileName || !totalChunks || !fileSize) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sanitizedFileName = sanitizeFileName(fileName);
    const uploadId = `${user.id}_${Date.now()}_${sanitizedFileName}`;
    const tempFolder = `temp/${user.id}/${uploadId}`;
    
    const { error: folderError } = await supabase.storage
      .from('music')
      .upload(`${tempFolder}/.keep`, new Blob(['']), {
        cacheControl: '3600',
        upsert: true,
      });

    if (folderError) {
      console.error('Error creating temp folder:', folderError);
      return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 });
    }

    return NextResponse.json({
      uploadId,
      tempFolder,
      totalChunks,
      fileSize,
    });
  } catch (error) {
    console.error('Error initializing upload:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Upload a chunk
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);

    if (!chunk || !uploadId || isNaN(chunkIndex)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const buffer = Buffer.from(await chunk.arrayBuffer());
    const chunkPath = `temp/${user.id}/${uploadId}/chunk_${chunkIndex}`;
    
    const { error: uploadError } = await supabase.storage
      .from('music')
      .upload(chunkPath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: chunk.type || 'application/octet-stream',
      });

    if (uploadError) {
      console.error('Error uploading chunk:', uploadError);
      // Return more specific error
      return NextResponse.json({ 
        error: 'Failed to upload chunk: ' + uploadError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, chunkIndex });
  } catch (error) {
    console.error('Error uploading chunk:', error);
    return NextResponse.json({ 
      error: 'Failed to upload chunk: ' + (error as Error).message 
    }, { status: 500 });
  }
}

// Complete upload - combine chunks and finalize
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, fileName, playlistId, title, artist } = body;

    if (!uploadId || !fileName || !playlistId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tempFolder = `temp/${user.id}/${uploadId}`;

    // List all chunks
    const { data: chunkList, error: listError } = await supabase.storage
      .from('music')
      .list(tempFolder);

    if (listError) {
      console.error('Error listing chunks:', listError);
      return NextResponse.json({ error: 'Failed to list chunks' }, { status: 500 });
    }

    // Filter chunks
    const chunkFiles = chunkList
      .filter(f => f.name.startsWith('chunk_'))
      .sort((a, b) => {
        const indexA = parseInt(a.name.split('_')[1]);
        const indexB = parseInt(b.name.split('_')[1]);
        return indexA - indexB;
      });

    if (chunkFiles.length === 0) {
      return NextResponse.json({ error: 'No chunks found' }, { status: 400 });
    }

    // Download and combine chunks
    const chunks: Buffer[] = [];
    for (const chunkFile of chunkFiles) {
      const { data: chunkData, error: downloadError } = await supabase.storage
        .from('music')
        .download(`${tempFolder}/${chunkFile.name}`);

      if (downloadError || !chunkData) {
        console.error('Error downloading chunk:', downloadError);
        return NextResponse.json({ error: 'Failed to download chunks' }, { status: 500 });
      }

      const buffer = Buffer.from(await chunkData.arrayBuffer());
      chunks.push(buffer);
    }

    // Combine all chunks
    const combinedBuffer = Buffer.concat(chunks);

    // Sanitize filename for the final file
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'mp3';
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const sanitizedBaseName = sanitizeFileName(baseName);
    const sanitizedFileName = `${sanitizedBaseName}.${fileExt}`;
    const finalFileName = `${user.id}/${Date.now()}_${sanitizedFileName}`;
    
    console.log('Uploading final file:', finalFileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('music')
      .upload(finalFileName, combinedBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: `audio/${fileExt}`,
      });

    if (uploadError) {
      console.error('Error uploading final file:', uploadError);
      return NextResponse.json({ 
        error: 'Failed to upload final file: ' + uploadError.message 
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('music')
      .getPublicUrl(finalFileName);

    // Clean up temp folder
    const chunkPaths = chunkFiles.map(f => `${tempFolder}/${f.name}`);
    await supabase.storage.from('music').remove(chunkPaths);
    await supabase.storage.from('music').remove([`${tempFolder}/.keep`]);

    const duration = 0;

    // Verify playlist exists
    const playlistCheck = await db
      .select()
      .from(musicPlaylists)
      .where(
        and(
          eq(musicPlaylists.id, playlistId),
          eq(musicPlaylists.userId, user.id)
        )
      );

    if (playlistCheck.length === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Save track to database
    const [track] = await db
      .insert(musicTracks)
      .values({
        userId: user.id,
        playlistId,
        title: title || baseName,
        artist: artist || 'Unknown Artist',
        fileUrl: publicUrl,
        duration: 0,
        fileSize: combinedBuffer.length,
        fileFormat: fileExt,
      })
      .returning();

    await db.insert(listeningHistory).values({
      userId: user.id,
      trackId: track.id,
      playlistId,
      completed: false,
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error('Error completing upload:', error);
    return NextResponse.json({ 
      error: 'Failed to complete upload: ' + (error as Error).message 
    }, { status: 500 });
  }
}