import React, { useEffect, useState } from 'react';
import { AnalyticsData, Squad } from '../types.ts';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Trophy, BarChart3, TrendingUp, Compass, AlertCircle, Award, Target } from 'lucide-react';

interface AnalyticsTabProps {
  token: string | null;
  squads: Squad[];
}

const COLORS = ['#E8A39E', '#8DA399', '#C5A059', '#A65645', '#5D7267', '#9E7D3F'];
const PIE_COLORS = ['#8DA399', '#E8A39E']; // Secured (Sage) vs Next Time (Blush Pink)

export default function AnalyticsTab({ token, squads }: AnalyticsTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLeaderboardSquad, setActiveLeaderboardSquad] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, squads]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      const analytics = await response.json();
      setData(analytics);
      
      // Auto-set the first squad leaderboard as active
      if (analytics.leaderboard && analytics.leaderboard.length > 0) {
        setActiveLeaderboardSquad(analytics.leaderboard[0].squadId);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error pulling analytics summaries.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2 bg-white rounded-3xl border border-kali-cream-200">
        <div className="w-8 h-8 border-3 border-kali-rose-200 border-t-kali-rose-600 rounded-full animate-spin"></div>
        <span className="text-xs font-mono">Compiling metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 border border-red-100 rounded-3xl flex items-center gap-2">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  // Prepare Pie Chart data: Secured vs Next Time
  const pieData = [
    { name: 'Secured', value: data.securedCount || 0 },
    { name: 'Next Time', value: data.nextTimeCount || 0 }
  ];
  const hasPieData = data.securedCount > 0 || data.nextTimeCount > 0;

  // Prepare Bar Chart data: Categories
  const barData = Object.entries(data.categoryCounts || {}).map(([key, value]) => ({
    name: key,
    Opportunities: value as number
  }));
  const hasBarData = barData.some(b => b.Opportunities > 0);

  // Prepare Timeline Chart data
  const lineData = (data.personalOverTime || []).map(item => ({
    date: item.dateStr,
    Count: item.count
  }));

  // Selected Leaderboard Squad details
  const currentLeaderboard = data.leaderboard?.find(l => l.squadId === activeLeaderboardSquad);

  // Total opportunities count
  const totalTracked = (Object.values(data.statusCounts || {}) as number[]).reduce((acc: number, c: number) => acc + c, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS METRIC ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-mono uppercase text-gray-400 tracking-wider">Divine Tracker</span>
          <div className="mt-2.5">
            <span className="text-3xl font-bold text-gray-900 leading-none">{totalTracked}</span>
            <p className="text-xs text-gray-500 mt-1">Opportunities Logged</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-mono uppercase text-kali-sage-600 tracking-wider">Secured Path</span>
          <div className="mt-2.5">
            <span className="text-3xl font-bold text-kali-sage-600 leading-none">{data.securedCount}</span>
            <p className="text-xs text-gray-500 mt-1">Milestones Secured</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-mono uppercase text-kali-rose-500 tracking-wider">Waiting Room</span>
          <div className="mt-2.5">
            <span className="text-3xl font-bold text-kali-rose-600 leading-none">
              {data.statusCounts['Waiting Room'] || 0}
            </span>
            <p className="text-xs text-gray-500 mt-1">Future application windows</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-mono uppercase text-[#a38743] tracking-wider">Active Run</span>
          <div className="mt-2.5">
            <span className="text-3xl font-bold text-gray-900 leading-none">
              {(data.statusCounts['In Progress'] || 0) + (data.statusCounts['Interviewing'] || 0)}
            </span>
            <p className="text-xs text-gray-500 mt-1">Underactive review</p>
          </div>
        </div>

      </div>

      {/* 2. PERSONAL CHARTS LAYER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Win/Loss (Secured vs Next Time) Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-4 flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 inline-flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-kali-sage-500" />
              Conversion Ratio (Secured vs Next Time)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Reflecting successful finalizations versus subsequent opportunities</p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {hasPieData ? (
              <>
                <div className="w-40 h-40 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-kali-sage-500"></span>
                    <span className="text-gray-600 font-medium">Secured: <strong className="text-gray-900">{data.securedCount}</strong> ({Math.round((data.securedCount / (data.securedCount + data.nextTimeCount)) * 100) || 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-kali-rose-500"></span>
                    <span className="text-gray-600 font-medium">Next Time: <strong className="text-gray-900">{data.nextTimeCount}</strong> ({Math.round((data.nextTimeCount / (data.securedCount + data.nextTimeCount)) * 100) || 0}%)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-2">
                <Compass className="w-8 h-8 text-kali-rose-200 mx-auto" />
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
                  No applications have reached the <strong className="text-gray-600">Secured</strong> or <strong className="text-gray-600">Next Time</strong> stage yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categories Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-4 flex flex-col justify-between min-h-[340px]">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 inline-flex items-center gap-2">
              <BarChart3 className="w-4.5 h-4.5 text-kali-rose-500" />
              Opportunities Category Mix
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Overview of targeted paths</p>
          </div>

          <div className="flex-1 w-full h-48 mt-4">
            {hasBarData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(232, 163, 158, 0.05)' }} contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #E8DED3' }} />
                  <Bar dataKey="Opportunities" fill="#E8A39E" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 space-y-2">
                <Compass className="w-8 h-8 text-kali-rose-200 mx-auto" />
                <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
                  Log opportunities to view category break downs.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. TIMELINE progress CHART */}
      <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-gray-900 inline-flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-kali-gold-500" />
            Opportunities Tracked Over Time
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Chronological frequency of logging career paths</p>
        </div>

        <div className="w-full h-48 mt-2">
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2D2CD" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#F2D2CD" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #E8DED3' }} />
                <Area type="monotone" dataKey="Count" stroke="#E8A39E" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Compass className="w-8 h-8 text-kali-rose-200 mx-auto" />
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
                Log opportunities over time to plot frequency timelines.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. SQUAD ACCOUNTABILITY LEADERBOARD */}
      <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-kali-cream-100 gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-gray-900 inline-flex items-center gap-2">
              <Trophy className="w-4.5 h-4.5 text-kali-gold-500" />
              Squad Leaderboards
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Gamified peer ranking based on shares and completed applications</p>
          </div>

          {/* Squad selector */}
          {data.leaderboard && data.leaderboard.length > 0 && (
            <div className="flex bg-kali-cream-100 p-1 rounded-xl">
              {data.leaderboard.map((ld) => (
                <button
                  key={ld.squadId}
                  onClick={() => setActiveLeaderboardSquad(ld.squadId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeLeaderboardSquad === ld.squadId ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {ld.squadName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ranks list */}
        {data.leaderboard && data.leaderboard.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Compass className="w-8 h-8 text-kali-rose-200 mx-auto" />
            <h4 className="font-serif text-base text-gray-800">Establish or Join a Squad First</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-normal">
              You must join or create a Squad first to trigger gamified leaderboards with your peers!
            </p>
          </div>
        ) : currentLeaderboard ? (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              
              {/* Leaderboard Rankings list (md: 7) */}
              <div className="md:col-span-7 space-y-2.5 max-h-[340px] overflow-y-auto pr-2">
                {currentLeaderboard.rankings.map((userRank, idx) => {
                  const place = idx + 1;
                  return (
                    <div
                      key={userRank.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        place === 1
                          ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                          : 'bg-kali-cream-50/20 border-kali-cream-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Placement medal */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          place === 1 ? 'bg-amber-100 text-amber-700 shadow-xs' :
                          place === 2 ? 'bg-gray-100 text-gray-600' :
                          place === 3 ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-400'
                        }`}>
                          {place === 1 ? '🥇' : place === 2 ? '🥈' : place === 3 ? '🥉' : place}
                        </div>

                        {/* User info */}
                        {userRank.photoURL ? (
                          <img
                            src={userRank.photoURL}
                            alt={userRank.displayName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full border border-kali-rose-100 shadow-xs"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-kali-rose-100 text-kali-rose-600 font-serif italic text-xs font-bold flex items-center justify-center border border-kali-rose-200">
                            {userRank.displayName?.charAt(0) || userRank.email.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold block">{userRank.displayName}</span>
                          <span className="text-[10px] text-gray-400">{userRank.opportunitiesCount} shared • {userRank.securedCount} secured</span>
                        </div>
                      </div>

                      {/* Points / Level */}
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold block text-kali-rose-600">+{userRank.points} pts</span>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400">Activity Level</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scoring logic detail (md: 5) */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-kali-sage-50/40 border border-kali-sage-100 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <span className="text-kali-sage-600 font-mono text-[10px] uppercase tracking-wider block">Gamification Layer</span>
                  <h4 className="font-serif text-base font-bold text-gray-900 inline-flex items-center gap-1.5">
                    <Award className="w-4.5 h-4.5 text-kali-sage-500" />
                    How Points Accumulate
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    KaLi gamifies your search experience to build healthy collaborative accountability. Secure outcomes and share opportunities to level up together!
                  </p>
                </div>

                <div className="space-y-2 border-t border-kali-sage-200/50 pt-3 text-[11px] text-gray-600 font-sans">
                  <div className="flex justify-between">
                    <span>📢 Share Opportunity in Squad:</span>
                    <strong className="text-gray-900 font-semibold">+10 pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>👑 Secure an Application (Status Secured):</span>
                    <strong className="text-gray-900 font-semibold">+30 pts</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : null}

      </div>

    </div>
  );
}
