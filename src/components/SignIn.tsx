import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Calendar, Users, Trophy, ChevronRight, Loader2, Compass } from 'lucide-react';

export default function SignIn() {
  const { refreshToken } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      await refreshToken();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-kali-cream-50 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Background soft blush ambient blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-kali-rose-100/50 filter blur-3xl opacity-70"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-kali-sage-100/40 filter blur-3xl opacity-70"></div>

      {/* Top logo */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-full bg-kali-rose-500 flex items-center justify-center text-white font-serif italic text-lg shadow-sm">K</div>
        <span className="font-serif italic font-bold tracking-widest text-kali-rose-600 text-xl">KaLi</span>
      </div>

      {/* Main content split */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto relative z-10">
        
        {/* Left column: Editorial intro */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kali-rose-100 text-kali-rose-600 text-xs font-semibold tracking-wider uppercase">
            <Compass className="w-3.5 h-3.5 text-kali-rose-500 animate-spin-slow" />
            Empowering Female Achievers
          </div>
          
          <h1 className="font-serif italic text-5xl md:text-6xl lg:text-7xl text-gray-900 tracking-tight leading-none">
            KaLi <br />
            <span className="text-kali-rose-500 not-italic font-normal">owns time,</span> <br />
            and so do you.
          </h1>
          
          <p className="text-gray-600 text-lg max-w-xl font-light leading-relaxed">
            <strong className="font-medium text-gray-800">KaLi</strong> is an elegant, premium opportunity tracking and intentional growth platform designed for women to conquer application deadlines, collaborate in supportive peer Squads, and build lasting accountability.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-kali-cream-200/50 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-kali-rose-100 flex items-center justify-center text-kali-rose-500">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Smart Tracking</h3>
              <p className="text-xs text-gray-500">Auto-moves opportunities from Waiting Room to Ready as application windows open.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-kali-cream-200/50 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-kali-sage-100 flex items-center justify-center text-kali-sage-500">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Squad Spaces</h3>
              <p className="text-xs text-gray-500">Create or join Squads. Share public opportunities and cheer each other on.</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-kali-cream-200/50 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-kali-gold-500">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">Accountability</h3>
              <p className="text-xs text-gray-500">Earn points for milestones. Complete tasks and reach the leaderboard peak.</p>
            </div>
          </div>
        </div>

        {/* Right column: Card with action */}
        <div className="lg:col-span-5 bg-white p-8 md:p-10 rounded-3xl border border-kali-cream-200 shadow-xl shadow-kali-rose-100/30 flex flex-col items-center text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-kali-rose-50 flex items-center justify-center border border-kali-rose-100">
            <span className="text-kali-rose-500 font-serif italic text-2xl font-bold">🌸</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-gray-900 font-medium">Track with Intention</h2>
            <p className="text-sm text-gray-500">Track jobs, grants, scholarships, and fellowships. Sign in using your Google account to get started immediately.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs w-full text-left border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1e1e1d] hover:bg-[#313130] text-white py-3.5 px-6 rounded-2xl font-medium tracking-wide shadow-md transition-all disabled:opacity-75 active:scale-95 group cursor-pointer"
          >
            {signingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-kali-rose-200" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="text-sm font-semibold">{signingIn ? 'Authenticating...' : 'Continue with Google'}</span>
            <ChevronRight className="w-4 h-4 text-kali-rose-200 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
              Empowered by Time
            </span>
          </div>
        </div>
      </div>

      {/* Footer credits */}
      <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-light pt-8 border-t border-kali-cream-200 relative z-10 max-w-6xl mx-auto w-full">
        <span>&copy; {new Date().getFullYear()} KaLi. Crafted with care for modern leaders.</span>
        <span className="mt-2 md:mt-0 italic font-serif">"Own your time, own your narrative."</span>
      </div>
    </div>
  );
}
