import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import SignIn from './components/SignIn.tsx';
import KanbanBoard from './components/KanbanBoard.tsx';
import OpportunityForm from './components/OpportunityForm.tsx';
import SquadSpace from './components/SquadSpace.tsx';
import AnalyticsTab from './components/AnalyticsTab.tsx';
import OnboardingFlow from './components/OnboardingFlow.tsx';
import CalendarSyncPanel from './components/CalendarSyncPanel.tsx';
import DesignStudio from './components/DesignStudio.tsx';
import { Opportunity, Squad, AlertLog } from './types.ts';
import {
  Calendar,
  Users,
  BarChart3,
  Sparkles,
  Plus,
  Compass,
  Bell,
  CheckCircle,
  HelpCircle,
  LogOut,
  AlertCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  BookOpen,
  Settings
} from 'lucide-react';

function KaLiAppContent() {
  const { user, token, logout, refreshToken } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'solo' | 'squad' | 'analytics' | 'settings'>('solo');

  // Core States
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [dbUser, setDbUser] = useState<any>(null);

  // Loading / UI States
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingSquads, setLoadingSquads] = useState(true);
  const [loadingWorker, setLoadingWorker] = useState(false);
  const [workerSuccess, setWorkerSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forms modals states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
  const [isSavingOpp, setIsSavingOpp] = useState(false);

  // Notifications Popover dropdown state
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Brand Customizer logo state (locked to Modernist Bauhaus per admin choice)
  const [selectedLogo, setSelectedLogo] = useState<string>('modernist');

  const handleLogoChange = (style: string) => {
    setSelectedLogo('modernist');
  };

  // UI Customization states
  const [uiStyle, setUiStyle] = useState<string>(() => {
    return localStorage.getItem('kali_ui_style') || 'cream';
  });

  const [cardTreatment, setCardTreatment] = useState<string>(() => {
    return localStorage.getItem('kali_card_treatment') || 'classic';
  });

  const [bgGridEnabled, setBgGridEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kali_bg_grid_enabled') !== 'false'; // default true
  });

  const handleUiStyleChange = (style: string) => {
    setUiStyle(style);
    localStorage.setItem('kali_ui_style', style);
  };

  const handleCardTreatmentChange = (treatment: string) => {
    setCardTreatment(treatment);
    localStorage.setItem('kali_card_treatment', treatment);
  };

  const handleBgGridChange = (enabled: boolean) => {
    setBgGridEnabled(enabled);
    localStorage.setItem('kali_bg_grid_enabled', String(enabled));
  };

  useEffect(() => {
    const completed = localStorage.getItem('kali_onboarding_completed');
    if (completed !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  // Current database user identifier sync
  const currentUserId = dbUser?.id || 0;

  // 1. Core Fetch logic
  useEffect(() => {
    if (token) {
      fetchUserOpportunities();
      fetchUserSquads();
      fetchAlertLogs();
    }
  }, [token]);

  const fetchUserOpportunities = async () => {
    setLoadingOpps(true);
    try {
      const response = await fetch('/api/opportunities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const list = await response.json();
        setOpportunities(list);
      } else {
        const err = await response.json();
        setErrorMessage(err.error || 'Failed to pull opportunities.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage('Network error fetching opportunities.');
    } finally {
      setLoadingOpps(false);
    }
  };

  const fetchUserSquads = async () => {
    setLoadingSquads(true);
    try {
      const response = await fetch('/api/squads', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const list = await response.json();
        setSquads(list);
        
        // Also sync backend user profile representation
        if (list.length > 0) {
          const self = list[0].members.find((m: any) => m.email.toLowerCase() === user?.email?.toLowerCase());
          if (self) setDbUser({ id: self.id, displayName: self.displayName, photoURL: self.photoURL });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSquads(false);
    }
  };

  const fetchAlertLogs = async () => {
    try {
      const response = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const logs = await response.json();
        if (logs.length > alertLogs.length && alertLogs.length > 0) {
          setHasNewNotifications(true);
        }
        setAlertLogs(logs);
      }
    } catch (e) {
      console.error('Error fetching alerts:', e);
    }
  };

  // Run the background window logic checker on request
  const handleTriggerWorker = async () => {
    setLoadingWorker(true);
    setWorkerSuccess(null);
    try {
      // Refresh token just in case
      const idToken = await refreshToken();
      const response = await fetch('/api/worker/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken || token}` }
      });
      if (response.ok) {
        const res = await response.json();
        setWorkerSuccess(`Checked successfully. Transited ${res.processedCount} opportunities.`);
        
        // Reload all data to reflect transitions instantly in UI
        await fetchUserOpportunities();
        await fetchAlertLogs();
        
        setTimeout(() => setWorkerSuccess(null), 4000);
      }
    } catch (e) {
      console.error('Error triggering worker:', e);
    } finally {
      setLoadingWorker(false);
    }
  };

  // 2. Opportunities Mutators
  const handleCreateOrUpdateOpp = async (payload: any) => {
    setIsSavingOpp(true);
    try {
      const url = editingOpportunity ? `/api/opportunities/${editingOpportunity.id}` : '/api/opportunities';
      const method = editingOpportunity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowFormModal(false);
        setEditingOpportunity(null);
        await fetchUserOpportunities(); // reload
        if (payload.isPublic) {
          await fetchUserSquads(); // reload shared feeds if posted to squad
        }
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to preserve opportunity');
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      setIsSavingOpp(false);
    }
  };

  const handleDeleteOpp = async (id: number) => {
    if (!confirm('Are you sure you want to permanently discard this tracked opportunity?')) {
      return;
    }
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchUserOpportunities();
      } else {
        alert('Could not delete opportunity.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        // Optimistic local state update for snappy UI
        setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Squad Mutators
  const handleCreateSquad = async (name: string) => {
    try {
      const response = await fetch('/api/squads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (response.ok) {
        await fetchUserSquads();
      } else {
        const err = await response.json();
        alert(err.error || 'Error establishing Squad');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinSquad = async (inviteCode: string) => {
    try {
      const response = await fetch('/api/squads/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteCode })
      });
      if (response.ok) {
        await fetchUserSquads();
      } else {
        const err = await response.json();
        alert(err.error || 'Invalid code or join error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeaveSquad = async (id: number) => {
    try {
      const response = await fetch(`/api/squads/${id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchUserSquads();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const appContainerClass = `app-container style-${uiStyle} ${bgGridEnabled ? 'bg-grid-paper' : ''} min-h-screen flex flex-col`;

  return (
    <div className={appContainerClass}>
      
      {/* ==============================================
          NAVIGATION BAR
          ============================================== */}
      <header className="bg-white border-b border-kali-cream-200 sticky top-0 z-40 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            {selectedLogo === 'serif' && (
              <>
                <div className="w-9 h-9 rounded-full border border-gray-900 flex items-center justify-center font-serif italic text-lg text-gray-900 font-bold shadow-xs bg-white">K</div>
                <div>
                  <span className="font-serif italic font-bold tracking-widest text-kali-rose-600 text-lg leading-none block">KaLi</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block mt-0.5">Intentional Tracker</span>
                </div>
              </>
            )}
            {selectedLogo === 'modernist' && (
              <>
                <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center text-white font-sans text-sm font-black shadow-sm">K</div>
                <div>
                  <span className="font-sans font-black tracking-tighter text-gray-900 text-lg leading-none block">KALI</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block mt-0.5">Growth Workspace</span>
                </div>
              </>
            )}
            {selectedLogo === 'mono' && (
              <>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-gray-400 text-base font-bold">[</span>
                  <span className="font-mono text-gray-900 text-base font-black tracking-widest">K L</span>
                  <span className="font-mono text-gray-400 text-base font-bold">]</span>
                </div>
                <div className="ml-1">
                  <span className="font-mono font-bold tracking-wider text-gray-800 text-sm leading-none block">KALI.LOG</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-gray-400 block mt-0.5">Deadline Terminal</span>
                </div>
              </>
            )}
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex bg-kali-cream-100 p-1 rounded-2xl border border-kali-cream-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab('solo')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'solo' ? 'bg-white text-kali-rose-600 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Solo Space
            </button>
            <button
              onClick={() => setActiveTab('squad')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'squad' ? 'bg-white text-kali-rose-600 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Squad Space
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-white text-kali-rose-600 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'settings' ? 'bg-white text-kali-rose-600 shadow-xs font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </nav>

          {/* Right Action Stack: Alert Logs & User details */}
          <div className="flex items-center gap-3.5">
            
            {/* Onboarding Guide Revisit button */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="p-2.5 rounded-full border border-kali-cream-200 bg-white hover:bg-kali-cream-50 text-gray-500 hover:text-gray-800 cursor-pointer transition-all"
              title="Replay Onboarding Guide"
            >
              <BookOpen className="w-4.5 h-4.5" />
            </button>
            
            {/* Interactive Alerts Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setHasNewNotifications(false);
                  fetchAlertLogs();
                }}
                className={`p-2.5 rounded-full border bg-white hover:bg-kali-cream-50 text-gray-500 hover:text-gray-800 cursor-pointer relative transition-all ${
                  hasNewNotifications ? 'border-kali-rose-300 shadow-sm animate-pulse' : 'border-kali-cream-200'
                }`}
                title="Accountability Alerts"
              >
                <Bell className="w-4.5 h-4.5" />
                {alertLogs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-kali-rose-500"></span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-kali-cream-200 shadow-2xl rounded-2xl py-4 px-4 z-50 animate-fade-in space-y-3.5 max-h-[400px] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-kali-cream-100 pb-2">
                    <span className="text-xs font-bold text-gray-900 font-serif">Accountability Alert Box</span>
                    <span className="text-[9px] font-mono uppercase bg-kali-rose-100 text-kali-rose-600 px-2 py-0.5 rounded-md">Emails sent</span>
                  </div>
                  
                  {alertLogs.length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400 italic">No emails dispatched yet.</p>
                      <p className="text-[10px] text-gray-400 mt-1">When WaitRoom openings match today, alerts register here!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 divide-y divide-kali-cream-100">
                      {alertLogs.map((log) => (
                        <div key={log.id} className="pt-2 text-left space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-kali-rose-600 leading-tight">🚀 "{log.title}" IS OPEN!</span>
                            <span className="text-[8px] font-mono text-gray-400">{log.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-gray-600">Successfully auto-moved to "Ready to Apply" on target date: <strong className="text-gray-900">{log.dateOpens}</strong>.</p>
                          <p className="text-[9px] text-gray-400 italic">An email notification has been dispatched to {log.email}.</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User display */}
            <div className="hidden sm:flex items-center gap-2.5 border-l border-kali-cream-200 pl-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  referrerPolicy="no-referrer"
                  className="w-8.5 h-8.5 rounded-full border border-kali-rose-200"
                />
              ) : (
                <div className="w-8.5 h-8.5 rounded-full bg-kali-rose-100 border border-kali-rose-200 flex items-center justify-center font-serif italic text-sm font-bold text-kali-rose-600">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <span className="text-xs font-bold text-gray-900 block leading-tight max-w-[100px] truncate">{user?.displayName || user?.email?.split('@')[0]}</span>
                <span className="text-[9px] font-mono text-gray-400 block uppercase">Achiever</span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="p-2.5 rounded-full border border-kali-cream-200 hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Small Responsive Bottom Navbar for mobile */}
        <div className="md:hidden flex bg-kali-cream-50 p-1 mt-3 rounded-xl border border-kali-cream-100">
          <button
            onClick={() => setActiveTab('solo')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${activeTab === 'solo' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500'}`}
          >
            Solo
          </button>
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${activeTab === 'squad' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500'}`}
          >
            Squad
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${activeTab === 'analytics' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg ${activeTab === 'settings' ? 'bg-white text-kali-rose-600 shadow-xs' : 'text-gray-500'}`}
          >
            Settings
          </button>
        </div>

      </header>

      {/* ==============================================
          MAIN CONTENT VIEW AREA
          ============================================== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        
        {/* Workspace alert messages */}
        {errorMessage && (
          <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs flex justify-between items-center">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold hover:text-red-800">Dismiss</button>
          </div>
        )}

        {/* Subheader Title & Background Worker runner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-kali-cream-200 shadow-xs">
          <div>
            <span className="text-xs text-kali-rose-500 uppercase tracking-widest font-mono font-semibold">KaLi</span>
            <h2 className="font-serif text-3xl text-gray-900 mt-1">
              {activeTab === 'solo' && (
                <>
                  Welcome back, <span className="text-kali-rose-500 font-serif italic">{user?.displayName ? user.displayName.split(' ')[0] : 'Achiever'}</span>! What are we doing today?
                </>
              )}
              {activeTab === 'squad' && 'Squad Accountability & Feed'}
              {activeTab === 'analytics' && 'Strategic Path Analytics'}
              {activeTab === 'settings' && 'Workspace & Brand Settings'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {activeTab === 'solo' && 'Map your private, coming-soon, in-progress, and submitted paths securely.'}
              {activeTab === 'squad' && 'Foster support, share public opportunities, and coordinate deadlines with your peers.'}
              {activeTab === 'analytics' && 'Visual insights covering categories, ratios, leaderboard, and timelines.'}
              {activeTab === 'settings' && 'Customize your visual style, card treatments, and paper grid textures.'}
            </p>
          </div>

          {/* Background worker simulation triggers */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-gray-400 block uppercase">Background Clock</span>
              <span className="text-[9px] text-gray-500 block">Periodic check runs every 20s</span>
            </div>
            <button
              onClick={handleTriggerWorker}
              disabled={loadingWorker}
              className="px-4 py-2.5 rounded-xl border border-kali-cream-200 hover:bg-kali-rose-50 text-xs font-semibold text-gray-700 hover:text-kali-rose-700 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer bg-white"
              title="Manually force-runs the date opening checks to move Waiting Room opportunities"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWorker ? 'animate-spin text-kali-rose-500' : ''}`} />
              {loadingWorker ? 'Checking...' : 'Force Check Windows'}
            </button>
          </div>
        </div>

        {/* Worker successes alerts */}
        {workerSuccess && (
          <div className="p-3 bg-kali-sage-50 text-kali-sage-700 border border-kali-sage-200 rounded-2xl text-xs font-semibold animate-fade-in flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-kali-sage-500" />
            <span>{workerSuccess}</span>
          </div>
        )}

        {/* Active Tab rendering */}
        {activeTab === 'solo' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Board Action section */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-xl text-gray-900 font-semibold">Tracked Paths</h3>
              </div>
              <button
                onClick={() => {
                  setEditingOpportunity(null);
                  setShowFormModal(true);
                }}
                className="px-5 py-2.5 bg-kali-rose-600 hover:bg-kali-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Opportunity
              </button>
            </div>

            {/* Board Content */}
            {loadingOpps ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2 bg-white rounded-3xl border border-kali-cream-200">
                <div className="w-8 h-8 border-3 border-kali-rose-200 border-t-kali-rose-600 rounded-full animate-spin"></div>
                <span className="text-xs font-mono">Loading your tracked paths...</span>
              </div>
            ) : (
              <KanbanBoard
                opportunities={opportunities}
                onEdit={(opp) => {
                  setEditingOpportunity(opp);
                  setShowFormModal(true);
                }}
                onDelete={handleDeleteOpp}
                onStatusChange={handleStatusChange}
                cardTreatment={cardTreatment}
              />
            )}

            {/* Calendar Integration */}
            <div className="pt-6">
              <CalendarSyncPanel 
                opportunities={opportunities} 
              />
            </div>

          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto">
            <DesignStudio 
              uiStyle={uiStyle}
              onUiStyleChange={handleUiStyleChange}
              cardTreatment={cardTreatment}
              onCardTreatmentChange={handleCardTreatmentChange}
              bgGridEnabled={bgGridEnabled}
              onBgGridChange={handleBgGridChange}
            />
          </div>
        )}

        {activeTab === 'squad' && (
          <SquadSpace
            squads={squads}
            token={token}
            currentUserId={currentUserId}
            onRefreshSquads={fetchUserSquads}
            onCreateSquad={handleCreateSquad}
            onJoinSquad={handleJoinSquad}
            onLeaveSquad={handleLeaveSquad}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            token={token}
            squads={squads}
          />
        )}

      </main>

      {/* ==============================================
          MODAL FORM POPUP (OPPORTUNITIES)
          ============================================== */}
      {showFormModal && (
        <OpportunityForm
          squads={squads}
          initialData={editingOpportunity}
          onSubmit={handleCreateOrUpdateOpp}
          onCancel={() => {
            setShowFormModal(false);
            setEditingOpportunity(null);
          }}
          isSaving={isSavingOpp}
        />
      )}

      {/* ==============================================
          INTERACTIVE ONBOARDING FLOW MODAL
          ============================================== */}
      {showOnboarding && (
        <OnboardingFlow onClose={() => setShowOnboarding(false)} />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-kali-cream-200 py-6 text-center text-xs text-gray-400 font-light">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; {new Date().getFullYear()} KaLi Tracker. Built with editorial precision for modern female leaders.</span>
          <span className="font-serif italic text-gray-500">"Own time, own the future."</span>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KaLiWrapper />
    </AuthProvider>
  );
}

function KaLiWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-kali-cream-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 border-4 border-kali-rose-200 border-t-kali-rose-600 rounded-full animate-spin shadow-inner"></div>
        <div className="text-center">
          <span className="font-serif italic text-kali-rose-600 font-bold tracking-widest text-lg">KaLi</span>
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mt-1">Preparing your tracking space...</p>
        </div>
      </div>
    );
  }

  return user ? <KaLiAppContent /> : <SignIn />;
}
