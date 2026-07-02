// app/api/notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { db } from '../../../../lib/db';
import { notes, noteSections } from '../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the id
    const { id } = await params;

    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const sections = await db
      .select()
      .from(noteSections)
      .where(eq(noteSections.noteId, id))
      .orderBy(noteSections.order);

    return NextResponse.json({
      ...note,
      sections,
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, topic, sections } = await request.json();

    // Verify note exists and belongs to user
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update note
    const [updatedNote] = await db
      .update(notes)
      .set({
        title,
        topic,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, id))
      .returning();

    // Handle sections if provided
    if (sections) {
      // Get existing sections
      const existingSections = await db
        .select()
        .from(noteSections)
        .where(eq(noteSections.noteId, id));

      const existingIds = new Set(existingSections.map(s => s.id));
      const updatedIds = new Set(
        sections
          .filter((s: any) => !s.id.startsWith('temp-'))
          .map((s: any) => s.id)
      );

      // Delete sections not in the update
      for (const section of existingSections) {
        if (!updatedIds.has(section.id)) {
          await db
            .delete(noteSections)
            .where(eq(noteSections.id, section.id));
        }
      }

      // Update or create sections
      for (const section of sections) {
        if (section.id.startsWith('temp-')) {
          // Create new section
          await db
            .insert(noteSections)
            .values({
              noteId: id,
              title: section.title || 'New Section',
              content: section.content || '',
              order: section.order || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
        } else {
          // Update existing section
          await db
            .update(noteSections)
            .set({
              title: section.title,
              content: section.content,
              order: section.order,
              updatedAt: new Date(),
            })
            .where(eq(noteSections.id, section.id));
        }
      }
    }

    // Fetch updated note with sections
    const [note] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id));

    const noteSectionsResult = await db
      .select()
      .from(noteSections)
      .where(eq(noteSections.noteId, id))
      .orderBy(noteSections.order);

    return NextResponse.json({
      ...note,
      sections: noteSectionsResult,
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify note exists and belongs to user
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete note (sections will be cascade deleted)
    await db
      .delete(notes)
      .where(eq(notes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}