// app/api/notes/[id]/sections/[sectionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { notes, noteSections } from '../../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { title, content, order } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, params.id), eq(notes.userId, userId)));

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify section exists and belongs to the note
    const [section] = await db
      .select()
      .from(noteSections)
      .where(and(
        eq(noteSections.id, params.sectionId),
        eq(noteSections.noteId, params.id)
      ));

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const [updatedSection] = await db
      .update(noteSections)
      .set({
        title: title || section.title,
        content: content !== undefined ? content : section.content,
        order: order !== undefined ? order : section.order,
        updatedAt: new Date(),
      })
      .where(eq(noteSections.id, params.sectionId))
      .returning();

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; sectionId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, params.id), eq(notes.userId, userId)));

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify section exists and belongs to the note
    const [section] = await db
      .select()
      .from(noteSections)
      .where(and(
        eq(noteSections.id, params.sectionId),
        eq(noteSections.noteId, params.id)
      ));

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    await db
      .delete(noteSections)
      .where(eq(noteSections.id, params.sectionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
  }
}