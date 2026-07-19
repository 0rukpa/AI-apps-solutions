import { db } from './index.ts';
import { opportunities, users } from './schema.ts';
import { eq, and, lte } from 'drizzle-orm';

// Store alerts in memory so the UI can retrieve them and display them in a user notification feed!
export interface AlertLog {
  id: number;
  email: string;
  title: string;
  dateOpens: string;
  timestamp: string;
}

export const alertLogsMemory: AlertLog[] = [];
let logIdCounter = 1;

export async function checkOpportunityWindows() {
  console.log('[Worker] Checking application windows at', new Date().toISOString());
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find opportunities in Waiting Room where dateOpens is <= today
    const list = await db.select({
      id: opportunities.id,
      title: opportunities.title,
      userId: opportunities.userId,
      dateOpens: opportunities.dateOpens,
      status: opportunities.status,
    })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.status, 'Waiting Room'),
        lte(opportunities.dateOpens, todayStr)
      )
    );

    for (const opp of list) {
      console.log(`[Worker] Opportunity "${opp.title}" (ID: ${opp.id}) has reached its open date (${opp.dateOpens}). Moving to "Ready to Apply"`);
      
      // Update opportunity status and app open flag
      await db.update(opportunities)
        .set({
          status: 'Ready to Apply',
          isAppOpen: true,
        })
        .where(eq(opportunities.id, opp.id));

      // Get user details
      const userList = await db.select().from(users).where(eq(users.id, opp.userId)).limit(1);
      if (userList.length > 0) {
        const u = userList[0];
        
        // Push to in-memory notification list so the frontend can display them beautifully!
        alertLogsMemory.push({
          id: logIdCounter++,
          email: u.email,
          title: opp.title,
          dateOpens: opp.dateOpens || todayStr,
          timestamp: new Date().toLocaleTimeString(),
        });

        console.log(`
========================================================================
🚀 [EMAIL ALERT SENT TO CLIENT]
To: ${u.email}
Subject: KaLi Alert: "${opp.title}" is now OPEN!
Dear ${u.displayName || 'KaLi user'},

The application window for "${opp.title}" has opened today (${opp.dateOpens})!
We have automatically moved this opportunity from your "Waiting Room" to your "Ready to Apply" column.

Apply here: Manage your opportunities directly in your KaLi Space.

Keep owning your time!
- Team KaLi 🌸
========================================================================
        `);
      }
    }
    return list;
  } catch (err) {
    console.error('[Worker Error] Failed to check opportunity windows:', err);
    throw err;
  }
}
