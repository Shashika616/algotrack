// lib/db/notes.ts
import { db } from '../../lib/db';
import { notes, noteSections, noteAttachments, noteToTags } from '../../lib/db/schema';
import { and, eq, desc, like, or, sql } from 'drizzle-orm';

export interface CreateNoteData {
  userId: string;
  title: string;
  topic: string;
}

export interface UpdateNoteData {
  title?: string;
  topic?: string;
  content?: string;
}

export interface CreateSectionData {
  noteId: string;
  title?: string;
  content?: string;
  order?: number;
}

export interface UpdateSectionData {
  title?: string;
  content?: string;
  order?: number;
}

export const notesDb = {
  // Get all notes for a user with pagination and search
  async getNotes(userId: string, page: number = 1, limit: number = 10, search: string = '') {
    const offset = (page - 1) * limit;

    let whereClause = eq(notes.userId, userId);
    
    if (search) {
      whereClause = and(
        whereClause,
        or(
          like(notes.title, `%${search}%`),
          like(notes.topic, `%${search}%`)
        )
      ) as any;
    }

    const results = await db
      .select()
      .from(notes)
      .where(whereClause)
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(whereClause);

    return {
      notes: results,
      total: Number(total[0]?.count || 0),
      totalPages: Math.ceil(Number(total[0]?.count || 0) / limit),
      currentPage: page,
    };
  },

  // Get a single note with its sections
  async getNoteById(noteId: string, userId: string) {
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

    if (!note) return null;

    const sections = await db
      .select()
      .from(noteSections)
      .where(eq(noteSections.noteId, noteId))
      .orderBy(noteSections.order);

    return {
      ...note,
      sections,
    };
  },

  // Create a new note
  async createNote(data: CreateNoteData) {
    const [note] = await db
      .insert(notes)
      .values({
        userId: data.userId,
        title: data.title,
        topic: data.topic,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return note;
  },

  // Update a note
  async updateNote(noteId: string, userId: string, data: UpdateNoteData) {
    const [note] = await db
      .update(notes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    return note;
  },

  // Delete a note (cascade will handle sections)
  async deleteNote(noteId: string, userId: string) {
    const [note] = await db
      .delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    return note;
  },

  // Section operations
  async getSections(noteId: string) {
    return await db
      .select()
      .from(noteSections)
      .where(eq(noteSections.noteId, noteId))
      .orderBy(noteSections.order);
  },

  async createSection(data: CreateSectionData) {
    // Get current max order
    const sections = await db
      .select({ order: noteSections.order })
      .from(noteSections)
      .where(eq(noteSections.noteId, data.noteId))
      .orderBy(desc(noteSections.order))
      .limit(1);

    const maxOrder = sections.length > 0 ? sections[0].order : -1;

    const [section] = await db
      .insert(noteSections)
      .values({
        noteId: data.noteId,
        title: data.title || 'New Section',
        content: data.content || '',
        order: data.order !== undefined ? data.order : maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return section;
  },

  async updateSection(sectionId: string, data: UpdateSectionData) {
    const [section] = await db
      .update(noteSections)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(noteSections.id, sectionId))
      .returning();

    return section;
  },

  async deleteSection(sectionId: string) {
    const [section] = await db
      .delete(noteSections)
      .where(eq(noteSections.id, sectionId))
      .returning();

    return section;
  },

  async reorderSections(sectionId: string, newOrder: number) {
    const [section] = await db
      .update(noteSections)
      .set({ 
        order: newOrder,
        updatedAt: new Date(),
      })
      .where(eq(noteSections.id, sectionId))
      .returning();

    return section;
  },

  // Batch update sections (for reordering multiple sections)
  async batchUpdateSections(sections: { id: string; order: number }[]) {
    const updates = sections.map(({ id, order }) =>
      db
        .update(noteSections)
        .set({ 
          order,
          updatedAt: new Date(),
        })
        .where(eq(noteSections.id, id))
        .returning()
    );

    return await Promise.all(updates);
  },
};