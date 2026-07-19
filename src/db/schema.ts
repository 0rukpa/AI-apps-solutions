import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// 1. Users Table (Auth via Firebase UI uid)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Squads Table
export const squads = pgTable('squads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdBy: integer('created_by')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Squad Members Table
export const squadMembers = pgTable('squad_members', {
  id: serial('id').primaryKey(),
  squadId: integer('squad_id')
    .references(() => squads.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: text('role').default('member').notNull(), // 'admin' or 'member'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// 4. Opportunities Table
export const opportunities = pgTable('opportunities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  squadId: integer('squad_id')
    .references(() => squads.id, { onDelete: 'set null' }), // shared squad space (null means private/solo)
  title: text('title').notNull(),
  organisation: text('organisation').notNull(),
  category: text('category').notNull(), // 'Job' | 'Grant' | 'Scholarship' | 'Fellowship' | 'Event' | 'Other'
  deadline: text('deadline').notNull(), // Format YYYY-MM-DD
  applicationLink: text('application_link'),
  status: text('status').notNull(), // 'Manifesting' | 'Waiting Room' | 'Ready to Apply' | 'In Progress' | 'Submitted' | 'Interviewing' | 'Secured' | 'Next Time'
  notes: text('notes'),
  isPublic: boolean('is_public').default(false).notNull(), // true if shared with squad
  isAppOpen: boolean('is_app_open').default(true).notNull(), // Application open toggle
  dateOpens: text('date_opens'), // Format YYYY-MM-DD (required if isAppOpen is false)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Comments Table
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Cheers Table
export const cheers = pgTable('cheers', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships definitions
export const usersRelations = relations(users, ({ many }) => ({
  squadsCreated: many(squads),
  squadMemberships: many(squadMembers),
  opportunities: many(opportunities),
  comments: many(comments),
  cheers: many(cheers),
}));

export const squadsRelations = relations(squads, ({ one, many }) => ({
  creator: one(users, {
    fields: [squads.createdBy],
    references: [users.id],
  }),
  members: many(squadMembers),
  opportunities: many(opportunities),
}));

export const squadMembersRelations = relations(squadMembers, ({ one }) => ({
  squad: one(squads, {
    fields: [squadMembers.squadId],
    references: [squads.id],
  }),
  user: one(users, {
    fields: [squadMembers.userId],
    references: [users.id],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  user: one(users, {
    fields: [opportunities.userId],
    references: [users.id],
  }),
  squad: one(squads, {
    fields: [opportunities.squadId],
    references: [squads.id],
  }),
  comments: many(comments),
  cheers: many(cheers),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [comments.opportunityId],
    references: [opportunities.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const cheersRelations = relations(cheers, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [cheers.opportunityId],
    references: [opportunities.id],
  }),
  user: one(users, {
    fields: [cheers.userId],
    references: [users.id],
  }),
}));
