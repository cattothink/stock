import React from 'react';
import { UserProfile } from '../types';
import { Users, Plus, RefreshCw, SlidersHorizontal, Sparkles, PawPrint } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenAddModal: () => void;
  onOpenUserModal: () => void;
  colorScheme: 'tw' | 'us'; // 'tw' = red is gain, green is loss; 'us' = green is gain, red is loss
  onToggleColorScheme: () => void;
  onRefreshLiveQuotes?: () => void;
  isRefreshing?: boolean;
  lastUpdatedTime?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  users,
  onSelectUser,
  onOpenAddModal,
  onOpenUserModal,
  colorScheme,
  onToggleColorScheme,
  onRefreshLiveQuotes,
  isRefreshing = false,
  lastUpdatedTime = null,
}) => {
  return (
    <header className="bg-zinc-900 text-slate-100 border-b border-zinc-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner with Market Indices */}
      <div className="bg-zinc-950 text-xs px-4 py-1.5 border-b border-zinc-800/80 flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none text-slate-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-300">🐾 市場焦點：</span>
            <span>台股加權 22,850.40</span>
            <span className="text-rose-400 font-bold">+182.30 (+0.80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>台積電 ADR (TSM) $174.50</span>
            <span className="text-rose-400 font-bold">+3.80 (+2.23%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>NASDAQ 17,980.20</span>
            <span className="text-emerald-400 font-bold">+125.40 (+0.70%)</span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-800 text-slate-200 px-2.5 py-0.5 rounded-full border border-zinc-700 font-medium">
            <span>🐱 罐罐指數：10,888 罐</span>
            <span className="font-bold text-amber-400">+52.0 (+0.48%)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleColorScheme}
            className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium transition-colors flex items-center gap-1 border border-zinc-700"
            title="切換顯示顏色習慣"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span>配色：{colorScheme === 'tw' ? '台股模式 (紅漲綠跌)' : '美股模式 (綠漲紅跌)'}</span>
          </button>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 shadow-md hover:bg-amber-500/20 transform hover:scale-105 transition-all cursor-pointer group">
            {/* Vector Cat Paw SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400 fill-current group-hover:text-amber-300 transition-colors">
              {/* Main Palm Pad */}
              <path d="M 50 82 C 34 82 24 68 32 54 C 38 43 62 43 68 54 C 76 68 66 82 50 82 Z" />
              {/* 4 Toe Pads */}
              <circle cx="26" cy="38" r="9" />
              <circle cx="41" cy="24" r="10" />
              <circle cx="59" cy="24" r="10" />
              <circle cx="74" cy="38" r="9" />
            </svg>
          </div>
          <div>
            <h1 className="font-normal text-3xl sm:text-4xl tracking-tight text-slate-100 leading-none">
              貓咪股市亂想
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Quote Refresh Button */}
          {onRefreshLiveQuotes && (
            <button
              onClick={onRefreshLiveQuotes}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                isRefreshing
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-slate-200 border-zinc-700 hover:border-zinc-600'
              }`}
              title="即時連線抓取台灣與美國股市最新報價"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? '線上更新中...' : '刷新實時股價'}
              </span>
              {lastUpdatedTime && !isRefreshing && (
                <span className="hidden md:inline text-[10px] text-slate-400 font-mono font-normal border-l border-zinc-700 pl-1.5">
                  {lastUpdatedTime}
                </span>
              )}
            </button>
          )}

          {/* User Profile Switcher with Round Avatar */}
          <div className="relative flex items-center bg-zinc-800/80 hover:bg-zinc-800 rounded-full p-1 border border-zinc-700 transition-colors shadow-sm">
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full text-sm font-bold text-slate-200 transition-colors"
              title="切換與修改觀察者身分"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center text-base shadow-inner flex-shrink-0">
                {currentUser.avatar}
              </div>
              <span className="max-w-[110px] sm:max-w-[160px] truncate text-slate-100 font-bold">
                {currentUser.name}
              </span>
              <Users className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
