import { pgTable, uuid, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';

// 1. Enums matching your Supabase definitions exactly
export const trackCategoryEnum = pgEnum('track_category', ['dsa', 'system_design']);
export const difficultyEnum = pgEnum('difficulty', ['Easy', 'Med', 'Hard']); // Capitalized to match CHECK constraints
export const statusEnum = pgEnum('status', ['solved', 'attempted', 'reviewed']);

// 2. Profiles table linked to Supabase Auth
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(), 
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
});

// 3. Structured Topics Table (e.g., Arrays, Load Balancers)
export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  category: trackCategoryEnum('category').notNull().default('dsa'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 4. Main Problems Table linked to your relational topics
export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(), // Supports LeetCode/system design markdown elements
  difficulty: difficultyEnum('difficulty').notNull().default('Easy'),
  imageUrls: text('image_urls').array().default([]), // Storage bucket asset reference strings
  examples: jsonb('examples').default([]), // Store input/output sample test arrays
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 5. Solution Panels Table to save persistent code tabs and whiteboard graphics state
export const solutionPanels = pgTable('solution_panels', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }), // Keeps user saves isolated
  language: text('language').notNull(), // 'python' | 'java' | 'c#' | 'javascript' | 'algorithm'
  codeContent: text('code_content').default(''),
  whiteboardData: jsonb('whiteboard_data').default({}), // Serialized vector canvas lines/shapes masking layers
  timeComplexity: text('time_complexity'),
  spaceComplexity: text('space_complexity'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
});

// 6. Daily Tracker Logs
export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  summary: text('summary'),
  mood: integer('mood'), 
});