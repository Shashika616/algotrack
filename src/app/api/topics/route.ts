import { NextResponse } from 'next/server';
import { db } from '../../../lib/db'; // Adjust this import path to point to your Drizzle db instance
import { topics } from '../../../lib/db/schema'; // Adjust this to point to your Drizzle schema file
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('track'); // 'dsa' | 'system_design'

  if (!category) {
    return NextResponse.json({ error: 'Track category parameter is required' }, { status: 400 });
  }

  try {
    // Drizzle syntax to select topics matching the category enum
    const result = await db
      .select()
      .from(topics)
      .where(eq(topics.category, category as any))
      .orderBy(topics.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Drizzle error fetching topics:", error);
    return NextResponse.json({ error: 'Failed to fetch database tracks' }, { status: 500 });
  }
}