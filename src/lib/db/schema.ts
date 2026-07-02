import { pgTable, uuid, text, timestamp, integer, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';

// 1. Enums matching your Supabase definitions
export const trackCategoryEnum = pgEnum('track_category', ['dsa', 'system_design']);
export const difficultyEnum = pgEnum('difficulty', ['Easy', 'Med', 'Hard']);

// 2. Topics table (Global)
export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: trackCategoryEnum('category').notNull().default('dsa'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 3. Problems table (Global)
export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: difficultyEnum('difficulty').notNull().default('Easy'),
  imageUrls: text('image_urls').array().default([]),
  examples: jsonb('examples').default([]),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 4. User Problems Tracking (User-specific)
export const userProblemsTracking = pgTable('user_problems_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('attempted'), // 'solved', 'attempted', 'reviewed'
  notes: text('notes'),
  url: text('url'),
  timeTaken: integer('time_taken'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  unq_user_problem: { columns: [table.userId, table.problemId] },
}));

// 5. Daily Logs (User-specific)
export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  date: timestamp('date', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  summary: text('summary'),
  mood: integer('mood'), 
});

// 6. Solution Panels (User-specific)
export const solutionPanels = pgTable('solution_panels', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  language: text('language').notNull(),
  codeContent: text('code_content').default(''),
  whiteboardData: jsonb('whiteboard_data').default({}),
  timeComplexity: text('time_complexity'),
  spaceComplexity: text('space_complexity'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// ============================================
// 7. MUSIC TABLES
// ============================================

// 7.1 Playlists table (User-specific)
export const musicPlaylists = pgTable('music_playlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  coverImage: text('cover_image'), // URL to cover image
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 7.2 Music Tracks table (User-specific)
export const musicTracks = pgTable('music_tracks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  playlistId: uuid('playlist_id').references(() => musicPlaylists.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  artist: text('artist'),
  album: text('album'),
  fileUrl: text('file_url').notNull(), // URL to the audio file in Supabase Storage
  duration: integer('duration'), // Duration in seconds
  fileSize: integer('file_size'), // File size in bytes
  fileFormat: text('file_format'), // 'mp3', 'wav', 'ogg', etc.
  coverImage: text('cover_image'), // URL to track cover image
  playCount: integer('play_count').default(0),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 7.3 User Listening History
export const listeningHistory = pgTable('listening_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  trackId: uuid('track_id').references(() => musicTracks.id, { onDelete: 'cascade' }).notNull(),
  playlistId: uuid('playlist_id').references(() => musicPlaylists.id, { onDelete: 'cascade' }),
  playedAt: timestamp('played_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  progress: integer('progress'), // How far they listened (in seconds)
  completed: boolean('completed').default(false), // Did they finish the track?
});

// 7.4 Music User Preferences
export const musicUserPreferences = pgTable('music_user_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(), // References auth.users
  defaultVolume: integer('default_volume').default(80), // 0-100
  shuffleMode: boolean('shuffle_mode').default(false),
  repeatMode: text('repeat_mode').default('none'), // 'none', 'one', 'all'
  lastPlayedPlaylistId: uuid('last_played_playlist_id').references(() => musicPlaylists.id, { onDelete: 'set null' }),
  lastPlayedTrackId: uuid('last_played_track_id').references(() => musicTracks.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// ============================================
// 8. NOTES TABLES
// ============================================

// 8.1 Notes table (User-specific)
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  title: text('title').notNull(),
  topic: text('topic').notNull(), // This stores the topic name as text
  content: text('content').default(''), // Keep for backward compatibility
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 8.2 Note Sections table
export const noteSections = pgTable('note_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull().default('New Section'),
  content: text('content').default(''),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 8.3 Note Tags (Optional - for better organization)
export const noteTags = pgTable('note_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // References auth.users
  name: text('name').notNull().unique(),
  color: text('color').default('#FF6B35'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 8.4 Note-Tag Junction table
export const noteToTags = pgTable('note_to_tags', {
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => noteTags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: { columns: [table.noteId, table.tagId] },
}));

// 8.5 Note Attachments (for images and files)
export const noteAttachments = pgTable('note_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  noteId: uuid('note_id').references(() => notes.id, { onDelete: 'cascade' }).notNull(),
  sectionId: uuid('section_id').references(() => noteSections.id, { onDelete: 'cascade' }),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  fileType: text('file_type'), // 'image', 'pdf', 'document', etc.
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});