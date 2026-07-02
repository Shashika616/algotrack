// app/api/notes/[id]/sections/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { notes, noteSections } from '../../../../../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { sectionOrders } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    if (!sectionOrders || !Array.isArray(sectionOrders)) {
      return NextResponse.json(
        { error: 'sectionOrders array is required' },
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

    // Update each section's order
    const updates = sectionOrders.map(async ({ id, order }: { id: string; order: number }) => {
      // Verify section belongs to this note
      const [section] = await db
        .select()
        .from(noteSections)
        .where(and(
          eq(noteSections.id, id),
          eq(noteSections.noteId, params.id)
        ));

      if (!section) {
        throw new Error(`Section ${id} not found in this note`);
      }

      return db
        .update(noteSections)
        .set({
          order,
          updatedAt: new Date(),
        })
        .where(eq(noteSections.id, id))
        .returning();
    });

    const results = await Promise.all(updates);
    const updatedSections = results.flat();

    return NextResponse.json(updatedSections);
  } catch (error) {
    console.error('Error reordering sections:', error);
    return NextResponse.json(
      { error: 'Failed to reorder sections' },
      { status: 500 }
    );
  }
}