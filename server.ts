import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { users, squads, squadMembers, opportunities, comments, cheers } from './src/db/schema.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { eq, and, desc, sql, lte } from 'drizzle-orm';
import { checkOpportunityWindows, alertLogsMemory } from './src/db/worker.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Run transition worker on startup
checkOpportunityWindows().then(() => {
  console.log('[Startup] Initial opportunity window check complete.');
}).catch(err => {
  console.error('[Startup Error] Initial opportunity window check failed:', err);
});

// Run window checker every 20 seconds to make it highly responsive during testing in UI Studio!
const checkInterval = setInterval(async () => {
  await checkOpportunityWindows();
}, 20000);

// ==========================================
// API ROUTES
// ==========================================

// 1. Health & Alerts
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/alerts', requireAuth, (req: AuthRequest, res) => {
  // Return alerts matching the authenticated user's email
  const userEmail = req.dbUser?.email;
  if (!userEmail) {
    return res.json([]);
  }
  const filtered = alertLogsMemory.filter(log => log.email.toLowerCase() === userEmail.toLowerCase());
  res.json(filtered);
});

// Explicit trigger to run background worker immediately
app.post('/api/worker/run', requireAuth, async (req: AuthRequest, res) => {
  try {
    const list = await checkOpportunityWindows();
    res.json({ success: true, processedCount: list.length, processed: list });
  } catch (error: any) {
    console.error('Manual worker run failed:', error);
    res.status(500).json({ error: 'Failed to run opportunity window worker', details: error.message });
  }
});

// 2. Opportunity Routes
app.get('/api/opportunities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const squadIdQuery = req.query.squadId;
    
    if (squadIdQuery) {
      const squadId = parseInt(squadIdQuery as string, 10);
      if (isNaN(squadId)) {
        return res.status(400).json({ error: 'Invalid squad ID' });
      }

      // Check if current user is a member of this squad to permit access
      const memberships = await db.select()
        .from(squadMembers)
        .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, req.dbUser!.id)))
        .limit(1);

      if (memberships.length === 0) {
        return res.status(403).json({ error: 'Access denied: You are not a member of this Squad' });
      }

      // Fetch opportunities shared with this squad, joined with the posting user's profile
      const list = await db.select({
        opportunity: opportunities,
        user: {
          id: users.id,
          displayName: users.displayName,
          photoURL: users.photoURL,
          email: users.email
        }
      })
      .from(opportunities)
      .innerJoin(users, eq(opportunities.userId, users.id))
      .where(and(eq(opportunities.squadId, squadId), eq(opportunities.isPublic, true)))
      .orderBy(desc(opportunities.createdAt));

      // Fetch comment counts and cheer counts for each opportunity
      const enrichedList = await Promise.all(list.map(async (item) => {
        const comms = await db.select({ count: sql<number>`count(*)::int` })
          .from(comments)
          .where(eq(comments.opportunityId, item.opportunity.id));
        
        const chs = await db.select({ count: sql<number>`count(*)::int` })
          .from(cheers)
          .where(eq(cheers.opportunityId, item.opportunity.id));

        const userCheered = await db.select()
          .from(cheers)
          .where(and(eq(cheers.opportunityId, item.opportunity.id), eq(cheers.userId, req.dbUser!.id)))
          .limit(1);

        return {
          ...item.opportunity,
          creator: item.user,
          commentCount: comms[0]?.count || 0,
          cheerCount: chs[0]?.count || 0,
          cheeredByMe: userCheered.length > 0
        };
      }));

      return res.json(enrichedList);
    } else {
      // Returns all personal opportunities for Solo Space
      const list = await db.select()
        .from(opportunities)
        .where(eq(opportunities.userId, req.dbUser!.id))
        .orderBy(desc(opportunities.createdAt));
      
      return res.json(list);
    }
  } catch (error: any) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities', details: error.message });
  }
});

app.post('/api/opportunities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      title,
      organisation,
      category,
      deadline,
      applicationLink,
      status,
      notes,
      isPublic,
      isAppOpen,
      dateOpens,
      squadId
    } = req.body;

    if (!title || !organisation || !category || !deadline) {
      return res.status(400).json({ error: 'Title, organisation, category, and deadline are required fields.' });
    }

    // Determine initial status based on window logic
    let initialStatus = status || 'Manifesting';
    let appOpenFlag = isAppOpen !== undefined ? isAppOpen : true;

    if (!appOpenFlag) {
      initialStatus = 'Waiting Room';
      if (!dateOpens) {
        return res.status(400).json({ error: '"Date Opens" is required when application is not yet open.' });
      }
    }

    const [opp] = await db.insert(opportunities)
      .values({
        userId: req.dbUser!.id,
        squadId: squadId ? parseInt(squadId, 10) : null,
        title,
        organisation,
        category,
        deadline,
        applicationLink: applicationLink || null,
        status: initialStatus,
        notes: notes || null,
        isPublic: isPublic || false,
        isAppOpen: appOpenFlag,
        dateOpens: dateOpens || null,
      })
      .returning();

    res.status(201).json(opp);
  } catch (error: any) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ error: 'Failed to create opportunity', details: error.message });
  }
});

app.put('/api/opportunities/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    // Verify ownership
    const existing = await db.select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, req.dbUser!.id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found or access denied' });
    }

    const {
      title,
      organisation,
      category,
      deadline,
      applicationLink,
      status,
      notes,
      isPublic,
      isAppOpen,
      dateOpens,
      squadId
    } = req.body;

    let targetStatus = status;
    let appOpenFlag = isAppOpen;

    // If changing "Is Application Open" to false, update status to Waiting Room
    if (appOpenFlag === false && existing[0].isAppOpen !== false) {
      targetStatus = 'Waiting Room';
      if (!dateOpens) {
        return res.status(400).json({ error: '"Date Opens" is required when application is closed' });
      }
    }

    // If user explicitly marks open, or status is changed out of waiting room
    if (appOpenFlag === true) {
      if (targetStatus === 'Waiting Room') {
        targetStatus = 'Ready to Apply';
      }
    }

    const [updated] = await db.update(opportunities)
      .set({
        title: title !== undefined ? title : existing[0].title,
        organisation: organisation !== undefined ? organisation : existing[0].organisation,
        category: category !== undefined ? category : existing[0].category,
        deadline: deadline !== undefined ? deadline : existing[0].deadline,
        applicationLink: applicationLink !== undefined ? applicationLink : existing[0].applicationLink,
        status: targetStatus !== undefined ? targetStatus : existing[0].status,
        notes: notes !== undefined ? notes : existing[0].notes,
        isPublic: isPublic !== undefined ? isPublic : existing[0].isPublic,
        isAppOpen: appOpenFlag !== undefined ? appOpenFlag : existing[0].isAppOpen,
        dateOpens: dateOpens !== undefined ? dateOpens : existing[0].dateOpens,
        squadId: squadId !== undefined ? (squadId ? parseInt(squadId, 10) : null) : existing[0].squadId,
      })
      .where(eq(opportunities.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({ error: 'Failed to update opportunity', details: error.message });
  }
});

app.delete('/api/opportunities/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    // Verify ownership
    const existing = await db.select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.userId, req.dbUser!.id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found or access denied' });
    }

    await db.delete(opportunities).where(eq(opportunities.id, id));
    res.json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting opportunity:', error);
    res.status(500).json({ error: 'Failed to delete opportunity', details: error.message });
  }
});

// 3. Squad Routes
app.get('/api/squads', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Fetch squads current user belongs to
    const memberSquads = await db.select({
      id: squads.id,
      name: squads.name,
      inviteCode: squads.inviteCode,
      createdBy: squads.createdBy,
      createdAt: squads.createdAt,
    })
    .from(squads)
    .innerJoin(squadMembers, eq(squads.id, squadMembers.squadId))
    .where(eq(squadMembers.userId, req.dbUser!.id));

    // Get all members for each squad to render details
    const squadsWithMembers = await Promise.all(memberSquads.map(async (sq) => {
      const membersList = await db.select({
        id: users.id,
        displayName: users.displayName,
        photoURL: users.photoURL,
        email: users.email,
        role: squadMembers.role,
        joinedAt: squadMembers.joinedAt
      })
      .from(squadMembers)
      .innerJoin(users, eq(squadMembers.userId, users.id))
      .where(eq(squadMembers.squadId, sq.id));

      return {
        ...sq,
        members: membersList
      };
    }));

    res.json(squadsWithMembers);
  } catch (error: any) {
    console.error('Error fetching squads:', error);
    res.status(500).json({ error: 'Failed to fetch squads', details: error.message });
  }
});

app.post('/api/squads', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Squad name is required' });
    }

    // Generate random invite code
    const inviteCode = 'KALI-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create squad
    const [sq] = await db.insert(squads)
      .values({
        name,
        inviteCode,
        createdBy: req.dbUser!.id,
      })
      .returning();

    // Auto add creator as Admin member
    await db.insert(squadMembers)
      .values({
        squadId: sq.id,
        userId: req.dbUser!.id,
        role: 'admin',
      });

    res.status(201).json({
      ...sq,
      members: [{
        id: req.dbUser!.id,
        displayName: req.dbUser!.displayName,
        photoURL: req.dbUser!.photoURL,
        email: req.dbUser!.email,
        role: 'admin'
      }]
    });
  } catch (error: any) {
    console.error('Error creating squad:', error);
    res.status(500).json({ error: 'Failed to create squad', details: error.message });
  }
});

app.post('/api/squads/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Lookup squad
    const sqs = await db.select()
      .from(squads)
      .where(eq(squads.inviteCode, inviteCode.trim().toUpperCase()))
      .limit(1);

    if (sqs.length === 0) {
      return res.status(404).json({ error: 'Squad not found. Please check the invite code.' });
    }

    const sq = sqs[0];

    // Check if already a member
    const existing = await db.select()
      .from(squadMembers)
      .where(and(eq(squadMembers.squadId, sq.id), eq(squadMembers.userId, req.dbUser!.id)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(200).json({ message: 'You are already a member of this Squad', squadId: sq.id });
    }

    // Add member
    await db.insert(squadMembers)
      .values({
        squadId: sq.id,
        userId: req.dbUser!.id,
        role: 'member',
      });

    res.status(200).json({ success: true, message: `Successfully joined ${sq.name}!`, squadId: sq.id });
  } catch (error: any) {
    console.error('Error joining squad:', error);
    res.status(500).json({ error: 'Failed to join squad', details: error.message });
  }
});

app.delete('/api/squads/:id/leave', requireAuth, async (req: AuthRequest, res) => {
  try {
    const squadId = parseInt(req.params.id, 10);
    if (isNaN(squadId)) {
      return res.status(400).json({ error: 'Invalid squad ID' });
    }

    // Check membership
    const memberships = await db.select()
      .from(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, req.dbUser!.id)))
      .limit(1);

    if (memberships.length === 0) {
      return res.status(404).json({ error: 'You are not a member of this squad' });
    }

    // Delete membership
    await db.delete(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, req.dbUser!.id)));

    // If squad has no members left, we can clean up the squad (optional, let's keep it clean)
    const membersLeft = await db.select()
      .from(squadMembers)
      .where(eq(squadMembers.squadId, squadId))
      .limit(1);

    if (membersLeft.length === 0) {
      await db.delete(squads).where(eq(squads.id, squadId));
    }

    res.json({ success: true, message: 'Successfully left the squad' });
  } catch (error: any) {
    console.error('Error leaving squad:', error);
    res.status(500).json({ error: 'Failed to leave squad', details: error.message });
  }
});

// 4. Shared Opportunity Interactions (Comments & Cheers)
app.get('/api/opportunities/:oppId/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const oppId = parseInt(req.params.oppId, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    const list = await db.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        displayName: users.displayName,
        photoURL: users.photoURL,
        email: users.email
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.opportunityId, oppId))
    .orderBy(desc(comments.createdAt));

    res.json(list);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

app.post('/api/opportunities/:oppId/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const oppId = parseInt(req.params.oppId, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const [comm] = await db.insert(comments)
      .values({
        opportunityId: oppId,
        userId: req.dbUser!.id,
        content: content.trim(),
      })
      .returning();

    // Fetch comment with user profile attached
    const commentWithUser = {
      ...comm,
      user: {
        id: req.dbUser!.id,
        displayName: req.dbUser!.displayName,
        photoURL: req.dbUser!.photoURL,
        email: req.dbUser!.email
      }
    };

    res.status(201).json(commentWithUser);
  } catch (error: any) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to post comment', details: error.message });
  }
});

app.post('/api/opportunities/:oppId/cheers', requireAuth, async (req: AuthRequest, res) => {
  try {
    const oppId = parseInt(req.params.oppId, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({ error: 'Invalid opportunity ID' });
    }

    // Check if already cheered
    const existing = await db.select()
      .from(cheers)
      .where(and(eq(cheers.opportunityId, oppId), eq(cheers.userId, req.dbUser!.id)))
      .limit(1);

    let cheered = false;

    if (existing.length > 0) {
      // Toggle off
      await db.delete(cheers)
        .where(and(eq(cheers.opportunityId, oppId), eq(cheers.userId, req.dbUser!.id)));
    } else {
      // Toggle on
      await db.insert(cheers)
        .values({
          opportunityId: oppId,
          userId: req.dbUser!.id,
        });
      cheered = true;
    }

    // Count total cheers
    const countResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(cheers)
      .where(eq(cheers.opportunityId, oppId));

    res.json({ cheeredByMe: cheered, cheerCount: countResult[0]?.count || 0 });
  } catch (error: any) {
    console.error('Error toggling cheer:', error);
    res.status(500).json({ error: 'Failed to toggle cheer', details: error.message });
  }
});

// 5. Analytics Route
app.get('/api/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;

    // 1. Personal counts by status
    const personalOpps = await db.select()
      .from(opportunities)
      .where(eq(opportunities.userId, userId));

    const statusCounts = {
      'Manifesting': 0,
      'Waiting Room': 0,
      'Ready to Apply': 0,
      'In Progress': 0,
      'Submitted': 0,
      'Interviewing': 0,
      'Secured': 0,
      'Next Time': 0,
    };

    const categoryCounts: { [key: string]: number } = {
      'Job': 0,
      'Grant': 0,
      'Scholarship': 0,
      'Fellowship': 0,
      'Event': 0,
      'Other': 0,
    };

    let securedCount = 0;
    let nextTimeCount = 0;

    personalOpps.forEach(o => {
      if (statusCounts.hasOwnProperty(o.status)) {
        statusCounts[o.status as keyof typeof statusCounts]++;
      }
      if (categoryCounts.hasOwnProperty(o.category)) {
        categoryCounts[o.category]++;
      }
      if (o.status === 'Secured') {
        securedCount++;
      } else if (o.status === 'Next Time') {
        nextTimeCount++;
      }
    });

    // 2. Personal Opportunities Over Time (by week of creation)
    const personalOverTimeRaw = await db.select({
      dateStr: sql<string>`TO_CHAR(${opportunities.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`
    })
    .from(opportunities)
    .where(eq(opportunities.userId, userId))
    .groupBy(sql`TO_CHAR(${opportunities.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${opportunities.createdAt}, 'YYYY-MM-DD')`);

    // 3. Squad Leadboards
    // For each squad the user is in, find all members and rank them by the count of opportunities they have posted.
    const memberSquads = await db.select({ id: squads.id, name: squads.name })
      .from(squads)
      .innerJoin(squadMembers, eq(squads.id, squadMembers.squadId))
      .where(eq(squadMembers.userId, userId));

    const leaderboard = await Promise.all(memberSquads.map(async (sq) => {
      // Find members of this squad
      const squadMems = await db.select({
        id: users.id,
        displayName: users.displayName,
        photoURL: users.photoURL,
        email: users.email,
      })
      .from(squadMembers)
      .innerJoin(users, eq(squadMembers.userId, users.id))
      .where(eq(squadMembers.squadId, sq.id));

      // For each member, count how many opportunities they shared in this squad or created overall
      const membersRank = await Promise.all(squadMems.map(async (mem) => {
        // Count shared opportunities in this squad
        const sharedCount = await db.select({ count: sql<number>`count(*)::int` })
          .from(opportunities)
          .where(and(
            eq(opportunities.userId, mem.id),
            eq(opportunities.squadId, sq.id)
          ));

        // Count total secured opportunities
        const secured = await db.select({ count: sql<number>`count(*)::int` })
          .from(opportunities)
          .where(and(
            eq(opportunities.userId, mem.id),
            eq(opportunities.status, 'Secured')
          ));

        return {
          id: mem.id,
          displayName: mem.displayName || mem.email.split('@')[0],
          photoURL: mem.photoURL,
          email: mem.email,
          opportunitiesCount: sharedCount[0]?.count || 0,
          securedCount: secured[0]?.count || 0,
          points: ((sharedCount[0]?.count || 0) * 10) + ((secured[0]?.count || 0) * 30) // gamified ranking!
        };
      }));

      // Sort members by points descending
      membersRank.sort((a, b) => b.points - a.points);

      return {
        squadId: sq.id,
        squadName: sq.name,
        rankings: membersRank
      };
    }));

    res.json({
      statusCounts,
      categoryCounts,
      securedCount,
      nextTimeCount,
      personalOverTime: personalOverTimeRaw,
      leaderboard
    });
  } catch (error: any) {
    console.error('Error computing analytics:', error);
    res.status(500).json({ error: 'Failed to load analytics data', details: error.message });
  }
});

// ==========================================
// VITE / STATIC CONTENT SERVING
// ==========================================

if (process.env.NODE_ENV !== 'production') {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // Bind fallback routes
    app.use('*', (req, res, next) => {
      vite.middlewares(req, res, next);
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Development full-stack server running on http://localhost:${PORT}`);
    });
  }).catch((err) => {
    console.error('Failed to create Vite development server:', err);
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server running on port ${PORT}`);
  });
}
