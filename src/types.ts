export interface DBUser {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
}

export interface SquadMember {
  id: number;
  displayName: string | null;
  photoURL: string | null;
  email: string;
  role: string;
  joinedAt: string;
}

export interface Squad {
  id: number;
  name: string;
  inviteCode: string;
  createdBy: number;
  createdAt: string;
  members: SquadMember[];
}

export interface Opportunity {
  id: number;
  userId: number;
  squadId: number | null;
  title: string;
  organisation: string;
  category: string; // 'Job' | 'Grant' | 'Scholarship' | 'Fellowship' | 'Event' | 'Other'
  deadline: string; // YYYY-MM-DD
  applicationLink: string | null;
  status: string; // 'Manifesting' | 'Waiting Room' | 'Ready to Apply' | 'In Progress' | 'Submitted' | 'Interviewing' | 'Secured' | 'Next Time'
  notes: string | null;
  isPublic: boolean;
  isAppOpen: boolean;
  dateOpens: string | null; // YYYY-MM-DD
  createdAt: string;
  
  // Enriched fields from Squad feed
  creator?: {
    id: number;
    displayName: string | null;
    photoURL: string | null;
    email: string;
  };
  commentCount?: number;
  cheerCount?: number;
  cheeredByMe?: boolean;
}

export interface Comment {
  id: number;
  opportunityId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    displayName: string | null;
    photoURL: string | null;
    email: string;
  };
}

export interface AlertLog {
  id: number;
  email: string;
  title: string;
  dateOpens: string;
  timestamp: string;
}

export interface AnalyticsData {
  statusCounts: { [key: string]: number };
  categoryCounts: { [key: string]: number };
  securedCount: number;
  nextTimeCount: number;
  personalOverTime: { dateStr: string; count: number }[];
  leaderboard: {
    squadId: number;
    squadName: string;
    rankings: {
      id: number;
      displayName: string;
      photoURL: string | null;
      email: string;
      opportunitiesCount: number;
      securedCount: number;
      points: number;
    }[];
  }[];
}
