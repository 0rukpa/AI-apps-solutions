import React, { useState, useEffect } from 'react';
import { Squad, Opportunity, Comment } from '../types.ts';
import { Users, Plus, Key, Copy, Check, MessageSquare, Heart, Calendar, Link, ArrowRight, UserPlus, LogOut, MessageCircle, AlertCircle, Compass, X } from 'lucide-react';

interface SquadSpaceProps {
  squads: Squad[];
  token: string | null;
  currentUserId: number;
  onRefreshSquads: () => Promise<void>;
  onCreateSquad: (name: string) => Promise<void>;
  onJoinSquad: (code: string) => Promise<void>;
  onLeaveSquad: (id: number) => Promise<void>;
}

export default function SquadSpace({
  squads,
  token,
  currentUserId,
  onRefreshSquads,
  onCreateSquad,
  onJoinSquad,
  onLeaveSquad
}: SquadSpaceProps) {
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [sharedOpps, setSharedOpps] = useState<Opportunity[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Modals / forms states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Interactive comments state (opportunityId -> comments list / active comment string)
  const [activeCommentsOpp, setActiveCommentsOpp] = useState<number | null>(null);
  const [oppComments, setOppComments] = useState<{ [key: number]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [loadingComments, setLoadingComments] = useState<number | null>(null);

  // Initialize selected squad
  useEffect(() => {
    if (squads.length > 0) {
      if (!selectedSquad || !squads.find(s => s.id === selectedSquad.id)) {
        setSelectedSquad(squads[0]);
      } else {
        // Update selected squad references if members changed
        const updated = squads.find(s => s.id === selectedSquad.id);
        if (updated) setSelectedSquad(updated);
      }
    } else {
      setSelectedSquad(null);
    }
  }, [squads]);

  // Fetch squad shared feed when selected squad changes
  useEffect(() => {
    if (selectedSquad && token) {
      fetchSquadFeed(selectedSquad.id);
    } else {
      setSharedOpps([]);
    }
  }, [selectedSquad, token]);

  const fetchSquadFeed = async (squadId: number) => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const response = await fetch(`/api/opportunities?squadId=${squadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve Squad feed');
      }
      const data = await response.json();
      setSharedOpps(data);
    } catch (err: any) {
      console.error(err);
      setFeedError(err.message || 'Error loading shared opportunities.');
    } finally {
      setLoadingFeed(false);
    }
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;
    try {
      await onCreateSquad(newSquadName.trim());
      setNewSquadName('');
      setShowCreateForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await onJoinSquad(joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle Cheers API
  const handleToggleCheer = async (oppId: number) => {
    try {
      const response = await fetch(`/api/opportunities/${oppId}/cheers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        
        // Update local shared feed cheer count instantly
        setSharedOpps(prev => prev.map(opp => {
          if (opp.id === oppId) {
            return {
              ...opp,
              cheerCount: result.cheerCount,
              cheeredByMe: result.cheeredByMe
            };
          }
          return opp;
        }));
      }
    } catch (err) {
      console.error('Error cheering:', err);
    }
  };

  // Comments Handling
  const handleToggleComments = async (oppId: number) => {
    if (activeCommentsOpp === oppId) {
      setActiveCommentsOpp(null);
      return;
    }
    
    setActiveCommentsOpp(oppId);
    setLoadingComments(oppId);
    try {
      const response = await fetch(`/api/opportunities/${oppId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const list = await response.json();
        setOppComments(prev => ({ ...prev, [oppId]: list }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(null);
    }
  };

  const handlePostComment = async (e: React.FormEvent, oppId: number) => {
    e.preventDefault();
    const commentText = commentInputs[oppId];
    if (!commentText || !commentText.trim()) return;

    try {
      const response = await fetch(`/api/opportunities/${oppId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText.trim() })
      });
      if (response.ok) {
        const newComm = await response.json();
        
        // Update comments locally
        setOppComments(prev => ({
          ...prev,
          [oppId]: [newComm, ...(prev[oppId] || [])]
        }));
        
        // Reset comment input
        setCommentInputs(prev => ({ ...prev, [oppId]: '' }));
        
        // Increment count in feed list
        setSharedOpps(prev => prev.map(opp => {
          if (opp.id === oppId) {
            return { ...opp, commentCount: (opp.commentCount || 0) + 1 };
          }
          return opp;
        }));
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* ==============================================
          LEFT COLUMN: Squad Directory & Member list (Col: 4)
          ============================================== */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Squad Selection Card */}
        <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-kali-cream-100">
            <h3 className="font-serif text-lg text-gray-900 font-medium inline-flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-kali-rose-500" />
              My Squads
            </h3>
            <span className="text-xs font-mono text-gray-400 bg-kali-cream-100 px-2 py-0.5 rounded-full">
              {squads.length} total
            </span>
          </div>

          {/* List of Joined Squads */}
          {squads.length === 0 ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-xs text-gray-400 italic">You are not a member of any Squad.</p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-kali-rose-100 hover:bg-kali-rose-200 text-kali-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" /> Join Squad
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-[#2a2a29] hover:bg-gray-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Squad
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
              {squads.map((sq) => (
                <button
                  key={sq.id}
                  onClick={() => setSelectedSquad(sq)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-sm transition-all border cursor-pointer ${
                    selectedSquad?.id === sq.id
                      ? 'bg-kali-rose-50/70 border-kali-rose-200 text-kali-rose-700 font-medium'
                      : 'border-transparent text-gray-600 hover:bg-kali-cream-50 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate">{sq.name}</span>
                  {selectedSquad?.id === sq.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-kali-rose-500"></span>
                  )}
                </button>
              ))}
              
              <div className="flex gap-2 pt-3 border-t border-kali-cream-100">
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-kali-rose-50 hover:bg-kali-rose-100 text-kali-rose-600 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Join
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-[#2a2a29] hover:bg-gray-800 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Squad Details Panel */}
        {selectedSquad && (
          <div className="bg-white p-5 rounded-2xl border border-kali-cream-200 shadow-xs space-y-4 animate-fade-in">
            <div className="space-y-1">
              <h3 className="font-serif text-xl text-gray-900 font-bold leading-tight">{selectedSquad.name}</h3>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase bg-kali-cream-100 px-2 py-0.5 rounded-md text-gray-500">
                  Invite Code: <strong className="text-gray-800 font-semibold">{selectedSquad.inviteCode}</strong>
                </span>
                <button
                  onClick={() => copyToClipboard(selectedSquad.inviteCode)}
                  className="p-1.5 rounded-md bg-kali-cream-100/50 hover:bg-kali-cream-100 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  title="Copy Invite Code"
                >
                  {copiedCode === selectedSquad.inviteCode ? (
                    <Check className="w-3 h-3 text-kali-sage-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-3 pt-3 border-t border-kali-cream-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sisterhood Roster</h4>
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {selectedSquad.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {member.photoURL ? (
                        <img
                          src={member.photoURL}
                          alt={member.displayName || 'Member'}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full border border-kali-rose-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-kali-rose-100 text-kali-rose-600 text-xs font-bold font-serif flex items-center justify-center border border-kali-rose-200">
                          {member.displayName?.charAt(0) || member.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-gray-900 max-w-[120px] truncate">
                          {member.displayName || member.email.split('@')[0]}
                          {member.id === currentUserId && <span className="text-[9px] font-light text-kali-rose-500 ml-1">(You)</span>}
                        </div>
                        <div className="text-[9px] text-gray-400 capitalize">{member.role}</div>
                      </div>
                    </div>
                    {member.role === 'admin' ? (
                      <span className="text-[8px] font-mono uppercase bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-md">Founder</span>
                    ) : (
                      <span className="text-[8px] font-mono uppercase bg-kali-sage-50 text-kali-sage-600 border border-kali-sage-100 px-1.5 py-0.5 rounded-md">Partner</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Squad Action */}
            <div className="pt-3 border-t border-kali-cream-100">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to leave ${selectedSquad.name}?`)) {
                    onLeaveSquad(selectedSquad.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Leave Squad
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==============================================
          RIGHT COLUMN: Feed & Shared Calendar (Col: 8)
          ============================================== */}
      <div className="lg:col-span-8 space-y-6">
        
        {selectedSquad ? (
          <div className="space-y-6">
            
            {/* Split Section: Collaborative feed / Calendar */}
            <div className="bg-white rounded-3xl border border-kali-cream-200 p-6 shadow-xs space-y-5">
              
              {/* Header Feed Panel */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-kali-cream-100 gap-4">
                <div>
                  <span className="text-xs text-kali-sage-600 uppercase font-mono tracking-widest">Feed & Milestones</span>
                  <h3 className="font-serif text-2xl text-gray-900 font-semibold mt-0.5">Shared Opportunities Feed</h3>
                </div>
                <button
                  onClick={() => fetchSquadFeed(selectedSquad.id)}
                  className="px-3 py-1.5 rounded-xl border border-kali-cream-200 hover:bg-kali-cream-50 text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                >
                  🔄 Refresh Feed
                </button>
              </div>

              {/* Feed Content */}
              {loadingFeed ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <div className="w-8 h-8 border-3 border-kali-rose-200 border-t-kali-rose-600 rounded-full animate-spin"></div>
                  <span className="text-xs font-mono">Synchronising with the sisterhood...</span>
                </div>
              ) : feedError ? (
                <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{feedError}</span>
                </div>
              ) : sharedOpps.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-kali-cream-100 flex items-center justify-center text-gray-400 mx-auto">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg text-gray-800">The Feed is Clean and Pure</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">None of your squad mates have shared opportunities in this squad yet. Edit your existing opportunities or create a new one, toggling "Share with Squad"!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sharedOpps.map((opp) => (
                    <div
                      key={opp.id}
                      className="p-5 rounded-2xl border border-kali-cream-200 bg-kali-cream-50/20 hover:border-kali-rose-100 transition-all space-y-4"
                    >
                      {/* Posted By user */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {opp.creator?.photoURL ? (
                            <img
                              src={opp.creator.photoURL}
                              alt={opp.creator.displayName || 'Creator'}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full border border-kali-rose-100"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-kali-rose-100 text-kali-rose-600 font-serif italic font-bold flex items-center justify-center border border-kali-rose-200">
                              {opp.creator?.displayName?.charAt(0) || opp.creator?.email.charAt(0).toUpperCase() || 'K'}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold text-gray-900">
                              {opp.creator?.displayName || opp.creator?.email.split('@')[0]}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">SHARED AN OPPORTUNITY</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(opp.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Opp Info */}
                      <div className="p-4 rounded-xl bg-white border border-kali-cream-200/60 shadow-xs space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="font-serif text-base font-bold text-gray-900">{opp.title}</h4>
                            <p className="text-xs text-gray-500 font-medium">{opp.organisation}</p>
                          </div>
                          <span className="text-[10px] font-mono uppercase bg-kali-rose-100 text-kali-rose-600 px-2 py-0.5 rounded-md">
                            {opp.category}
                          </span>
                        </div>

                        {opp.notes && (
                          <p className="text-xs text-gray-600 italic bg-kali-cream-50/50 p-2.5 rounded-lg border border-kali-cream-100">
                            "{opp.notes}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-kali-cream-100/60 pt-3">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-kali-rose-500" />
                            <span>Deadline: <strong className="text-gray-800 font-medium">{opp.deadline}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-gray-400 uppercase">Stage:</span>
                            <span className="px-2.5 py-0.5 bg-kali-sage-50 text-kali-sage-700 border border-kali-sage-200 rounded-full font-medium text-[10px]">
                              {opp.status}
                            </span>
                          </div>
                        </div>

                        {opp.applicationLink && (
                          <a
                            href={opp.applicationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-kali-rose-600 hover:text-kali-rose-700 font-semibold pt-1"
                          >
                            <Link className="w-3.5 h-3.5" />
                            Visit Application Portal
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Bottom Interactions: Cheers & Comment Button */}
                      <div className="flex items-center gap-4 pt-1">
                        <button
                          onClick={() => handleToggleCheer(opp.id)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            opp.cheeredByMe
                              ? 'bg-red-50 border-red-200 text-red-600 font-semibold'
                              : 'bg-white border-kali-cream-200 text-gray-500 hover:text-gray-800 hover:bg-kali-cream-50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${opp.cheeredByMe ? 'fill-red-600 text-red-600' : ''}`} />
                          <span>Cheers ({opp.cheerCount})</span>
                        </button>
                        
                        <button
                          onClick={() => handleToggleComments(opp.id)}
                          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                            activeCommentsOpp === opp.id
                              ? 'bg-kali-rose-50 border-kali-rose-200 text-kali-rose-700 font-semibold'
                              : 'bg-white border-kali-cream-200 text-gray-500 hover:text-gray-800 hover:bg-kali-cream-50'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Comments ({opp.commentCount})</span>
                        </button>
                      </div>

                      {/* Comments Accordion Drawer */}
                      {activeCommentsOpp === opp.id && (
                        <div className="border-t border-kali-cream-100 pt-4 mt-2 space-y-4 animate-fade-in">
                          {/* Post Comment Input */}
                          <form onSubmit={(e) => handlePostComment(e, opp.id)} className="flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[opp.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [opp.id]: e.target.value })}
                              placeholder="Leave a message of encouragement, tip, or cheer..."
                              className="flex-1 px-4 py-2.5 rounded-xl border border-kali-cream-200 text-xs focus:outline-none focus:ring-1 focus:ring-kali-rose-500"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2.5 rounded-xl bg-kali-rose-500 hover:bg-kali-rose-600 text-white text-xs font-semibold shadow-xs cursor-pointer"
                            >
                              Send
                            </button>
                          </form>

                          {/* Comments List */}
                          {loadingComments === opp.id ? (
                            <p className="text-[10px] text-gray-400 italic">Reading previous messages...</p>
                          ) : (oppComments[opp.id] || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-1 px-1">First comment? Give them some good energy! ✨</p>
                          ) : (
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                              {(oppComments[opp.id] || []).map((comm) => (
                                <div key={comm.id} className="bg-white p-3 rounded-xl border border-kali-cream-100 flex items-start gap-2.5">
                                  {comm.user.photoURL ? (
                                    <img
                                      src={comm.user.photoURL}
                                      alt={comm.user.displayName || 'User'}
                                      referrerPolicy="no-referrer"
                                      className="w-6.5 h-6.5 rounded-full"
                                    />
                                  ) : (
                                    <div className="w-6.5 h-6.5 rounded-full bg-kali-rose-50 text-kali-rose-600 font-serif italic text-[10px] font-bold flex items-center justify-center border border-kali-rose-100">
                                      {comm.user.displayName?.charAt(0) || comm.user.email.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-gray-900">
                                        {comm.user.displayName || comm.user.email.split('@')[0]}
                                      </span>
                                      <span className="text-[9px] text-gray-400">
                                        {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{comm.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* ==============================================
                SQUAD SHARED CALENDAR
                ============================================== */}
            <div className="bg-white rounded-3xl border border-kali-cream-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-kali-cream-100">
                <div>
                  <span className="text-xs text-kali-gold-600 uppercase font-mono tracking-widest">Shared Calendar</span>
                  <h3 className="font-serif text-lg text-gray-900 font-semibold mt-0.5">Upcoming Deadlines</h3>
                </div>
                <span className="text-xs font-mono text-gray-400 bg-kali-cream-100 px-2.5 py-1 rounded-full border">
                  {sharedOpps.length} Shared deadlines
                </span>
              </div>

              {/* Render sequential list of deadlines sorted chronologically */}
              {sharedOpps.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">No shared opportunities to construct the squad agenda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Calendar list */}
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {[...sharedOpps]
                      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                      .map((opp) => {
                        const dateObj = new Date(opp.deadline);
                        const day = dateObj.getDate();
                        const month = dateObj.toLocaleString('default', { month: 'short' });
                        
                        return (
                          <div key={opp.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-kali-cream-200 bg-kali-cream-50/10">
                            <div className="w-10 h-10 flex-shrink-0 bg-kali-rose-100/50 rounded-xl flex flex-col items-center justify-center text-kali-rose-600 font-mono">
                              <span className="text-[10px] uppercase font-bold tracking-tight">{month}</span>
                              <span className="text-xs font-bold leading-none">{day}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-gray-900 truncate">{opp.title}</h5>
                              <p className="text-[10px] text-gray-400 truncate">{opp.organisation} • Posted by {opp.creator?.displayName || 'Partner'}</p>
                            </div>
                            <span className="text-[9px] font-mono bg-kali-sage-50 border border-kali-sage-200 text-kali-sage-700 px-2 py-0.5 rounded-md">
                              {opp.status}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Aesthetic visual sidebar note */}
                  <div className="p-4 rounded-2xl bg-kali-rose-50/40 border border-kali-rose-200/50 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-kali-rose-600 uppercase font-mono tracking-widest">Sisterhood Support Alert</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These deadlines are synchronized for accountability. Reach out to partners who are <strong className="text-gray-800 font-medium">"In Progress"</strong> or <strong className="text-gray-800 font-medium">"Manifesting"</strong> to offer reviews, practice interviews, or encouragement!
                      </p>
                    </div>
                    <div className="pt-4 border-t border-kali-rose-100 text-[10px] text-kali-rose-500 font-mono uppercase tracking-wider flex justify-between items-center">
                      <span>🌸 Active accountability</span>
                      <span>Squad: {selectedSquad.name}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-kali-cream-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-kali-rose-50 flex items-center justify-center text-kali-rose-500 mx-auto border border-kali-rose-100">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-serif text-2xl text-gray-900 font-semibold">Join the Circle</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Squad Mode empowers you to collaborate with close partners. Create a custom Squad or input an existing invite code to share opportunities, leave comments, cheer milestones, and reach heights together.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 max-w-sm mx-auto">
              <button
                onClick={() => setShowJoinForm(true)}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#2a2a29] hover:bg-gray-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Key className="w-4 h-4" /> Join Existing Squad
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex-1 py-3 px-4 rounded-2xl bg-kali-rose-100 hover:bg-kali-rose-200 text-kali-rose-600 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-kali-rose-200/50"
              >
                <Plus className="w-4 h-4" /> Create New Squad
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ==============================================
          MODAL: CREATE SQUAD FORM
          ============================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-2xl w-full max-w-md space-y-5">
            <div className="flex justify-between items-center border-b border-kali-cream-100 pb-3">
              <h3 className="font-serif text-xl text-gray-900 font-bold">Divine a New Squad</h3>
              <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-full hover:bg-kali-cream-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Squad Name</label>
                <input
                  type="text"
                  required
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="e.g., Divine Career Alliance, Ivy Achievers"
                  className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-1 focus:ring-kali-rose-500 bg-kali-cream-50/20 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-kali-rose-500 hover:bg-kali-rose-600 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Establish Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================
          MODAL: JOIN SQUAD FORM
          ============================================== */}
      {showJoinForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-2xl w-full max-w-md space-y-5">
            <div className="flex justify-between items-center border-b border-kali-cream-100 pb-3">
              <h3 className="font-serif text-xl text-gray-900 font-bold">Join Sister Circle</h3>
              <button onClick={() => setShowJoinForm(false)} className="p-1 rounded-full hover:bg-kali-cream-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleJoinSquad} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block">Invite Code</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g., KALI-XF83A"
                  className="w-full px-4 py-3 rounded-xl border border-kali-cream-200 focus:outline-none focus:ring-1 focus:ring-kali-rose-500 bg-kali-cream-50/20 text-sm uppercase font-mono tracking-widest text-center"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-kali-rose-500 hover:bg-kali-rose-600 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Enter Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
