'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Problems', path: '/dashboard/problems', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { label: 'Stats', path: '/dashboard/stats', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'Daily Log', path: '/dashboard/log', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Topics', path: '/dashboard/topics', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { label: 'Saved Notes', path: '/dashboard/notes', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 antialiased selection:bg-orange-100">
      
      {/* MOBILE HEADER - Only visible on small screens */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/70 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5 stroke-slate-700" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="text-[#10B981] font-bold text-base">💻</span>
            <span>AlgoTrack</span>
            <span className="text-[9px] font-mono font-medium text-orange-500 bg-orange-50 border border-orange-100 px-1 py-0.5 rounded">PRO</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] font-bold text-[#FF6B35] shrink-0">
            SF
          </div>
        </div>
      </div>

      {/* SIDEBAR OVERLAY - Mobile only */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          flex flex-col bg-white border-r border-slate-200/70 p-5 shrink-0 select-none
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:w-[200px] w-[280px]
        `}
      >
        {/* Close button - Only visible on mobile */}
        <button
          onClick={toggleSidebar}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
          aria-label="Close sidebar"
        >
          <svg className="w-4 h-4 stroke-slate-500" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Unified Application Branding - PRO text next to icon */}
        <div className="text-sm font-bold tracking-tight text-slate-800 pb-5 mb-4 border-b border-slate-100 flex items-center gap-2">
          <span className="text-[#10B981] font-bold text-base">💻</span>
          <span className="hidden md:inline">AlgoTrack</span>
          <span className="md:hidden">AlgoTrack</span>
          <span className="text-[9px] font-mono font-medium text-orange-500 bg-orange-50 border border-orange-100 px-1 py-0.5 rounded">PRO</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/dashboard');
            return (
              <Link
                key={item.label}
                href={item.path}
                onClick={() => {
                  // Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-orange-50/70 text-[#FF6B35] font-semibold border border-orange-100/50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <svg className={`w-4 h-4 fill-none stroke-[1.75] shrink-0 ${isActive ? 'stroke-[#FF6B35]' : 'stroke-slate-400'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 mt-1">
            <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all w-full text-left cursor-pointer">
              <svg className="w-4 h-4 fill-none stroke-current stroke-[1.75] shrink-0" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5 mt-auto">
          <div className="flex items-center gap-2.5 px-1.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[10px] font-bold text-[#FF6B35] shrink-0">
              SF
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-semibold text-slate-800 truncate" title="Shashika Fernando">
                Shashika Fernando
              </span>
              <span className="text-[9px] font-mono font-medium text-slate-400 tracking-wider uppercase mt-0.5">
                Operator Instance
              </span>
            </div>
          </div>

          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#FF6B35] bg-slate-50 hover:bg-orange-50/50 border border-slate-200/60 hover:border-orange-100 rounded-lg transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[1.75]" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </Link>
        </div>
      </aside>

      {/* VIEWPORT AREA WRAPPER */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Spacer for mobile header */}
        <div className="h-14 md:h-0" />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}