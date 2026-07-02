// app/api/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { db } from '../../../lib/db';
import { notes, noteSections } from '../../../lib/db/schema';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // Build where clause with user.id from auth
    let whereClause = eq(notes.userId, user.id);
    
    if (search) {
      whereClause = and(
        whereClause,
        or(
          like(notes.title, `%${search}%`),
          like(notes.topic, `%${search}%`)
        )
      ) as any;
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);

    // Get paginated notes
    const result = await db
      .select()
      .from(notes)
      .where(whereClause)
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    // Get sections for each note
    const notesWithSections = await Promise.all(
      result.map(async (note) => {
        const sections = await db
          .select()
          .from(noteSections)
          .where(eq(noteSections.noteId, note.id))
          .orderBy(noteSections.order);
        
        return {
          ...note,
          sections,
        };
      })
    );

    return NextResponse.json({
      notes: notesWithSections,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, topic } = await request.json();

    if (!title || !topic) {
      return NextResponse.json(
        { error: 'Title and topic are required' },
        { status: 400 }
      );
    }

    const [note] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title,
        topic,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}