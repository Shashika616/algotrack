// app/api/notes/[id]/sections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';
import { db } from '../../../../../lib/db';
import { notes, noteSections } from '../../../../../lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify note exists and belongs to user
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

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, order } = await request.json();

    // Verify note exists and belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, user.id)));

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Get max order if not provided
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrderResult = await db
        .select({ maxOrder: sql<number>`max(${noteSections.order})` })
        .from(noteSections)
        .where(eq(noteSections.noteId, id));
      
      finalOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;
    }

    const [section] = await db
      .insert(noteSections)
      .values({
        noteId: id,
        title: title || 'New Section',
        content: content || '',
        order: finalOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}