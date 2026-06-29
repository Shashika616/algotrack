import { pgTable, uuid, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';

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
  // Ensure a user can only have one entry per problem
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

// 6. Solution Panels (User-specific) - if you need this
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