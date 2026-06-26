'use client';

export default function LandingPage() {
  return (
    <main className="flex h-screen bg-slate-50 antialiased overflow-hidden">
      {/* LEFT PANEL: LANDING SPLASH with 3D shapes + interactive elements */}
      <div className="hidden lg:flex lg:w-1/2 p-8 flex-col justify-between relative overflow-hidden select-none border-r border-orange-100 bg-gradient-to-b from-orange-50/60 via-slate-50 to-[#FF6B35]/15">
        {/* crisp vector grid */}
        <div className="absolute inset-0 opacity-[0.25] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* 3D floating geometric shapes */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-[#FF6B35]/10 blur-3xl animate-float" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute bottom-20 left-5 w-48 h-48 rounded-full bg-[#10B981]/10 blur-3xl animate-float" style={{ animationDelay: '0.8s' }}></div>
        <div className="absolute top-1/3 left-1/4 w-20 h-20 border-2 border-[#FF6B35]/20 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-16 h-16 border-2 border-[#10B981]/20 rounded-lg animate-pulse-slow"></div>
        
        {/* Brand header */}
        <div className="flex items-center gap-2 text-slate-800 relative z-10 font-sans font-bold tracking-tight text-sm px-4 pt-4">
          <span className="text-[#FF6B35] animate-bounce-subtle">💻</span> AlgoTrack
        </div>
        
        {/* CENTRAL: 3D rotating cube with floating particles */}
        <div className="relative w-full max-w-lg xl:max-w-xl mx-auto my-auto aspect-square flex items-center justify-center overflow-visible">
          <div className="relative w-64 h-64">
            {/* Floating particles */}
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#FF6B35] rounded-full animate-particle" style={{ animationDelay: '0s' }}></div>
            <div className="absolute top-1/4 right-0 w-2 h-2 bg-[#10B981] rounded-full animate-particle" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-0 left-1/3 w-2 h-2 bg-[#FF6B35] rounded-full animate-particle" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-0 w-2 h-2 bg-[#10B981] rounded-full animate-particle" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-[#FF6B35] rounded-full animate-particle" style={{ animationDelay: '2s' }}></div>
            
            {/* 3D rotating cube */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-40 h-40 animate-rotate-3d">
                {/* Front face */}
                <div className="absolute inset-0 border-2 border-[#FF6B35]/30 rounded-xl bg-gradient-to-br from-[#FF6B35]/5 to-transparent backdrop-blur-sm translate-z-20"></div>
                {/* Back face */}
                <div className="absolute inset-0 border-2 border-[#10B981]/30 rounded-xl bg-gradient-to-br from-[#10B981]/5 to-transparent backdrop-blur-sm -translate-z-20"></div>
                {/* Left face */}
                <div className="absolute inset-0 border-2 border-[#FF6B35]/20 rounded-xl bg-gradient-to-br from-[#FF6B35]/5 to-transparent backdrop-blur-sm -translate-x-20 rotate-y-90"></div>
                {/* Right face */}
                <div className="absolute inset-0 border-2 border-[#10B981]/20 rounded-xl bg-gradient-to-br from-[#10B981]/5 to-transparent backdrop-blur-sm translate-x-20 rotate-y-90"></div>
                {/* Top face */}
                <div className="absolute inset-0 border-2 border-[#FF6B35]/20 rounded-xl bg-gradient-to-br from-[#FF6B35]/5 to-transparent backdrop-blur-sm -translate-y-20 rotate-x-90"></div>
                {/* Bottom face */}
                <div className="absolute inset-0 border-2 border-[#10B981]/20 rounded-xl bg-gradient-to-br from-[#10B981]/5 to-transparent backdrop-blur-sm translate-y-20 rotate-x-90"></div>
                {/* Center glow */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#FF6B35] to-[#10B981] rounded-full opacity-20 blur-2xl animate-pulse-glow"></div>
                </div>
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#10B981] bg-clip-text text-transparent">AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* footer with unique branding */}
        <div className="text-[11px] font-mono text-slate-400 relative z-10 flex items-center justify-between border-t border-slate-200/60 px-4 pt-4">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] animate-ping"></span>
            LIVE SYSTEM
          </span>
          <span className="text-slate-500 font-bold tracking-wide uppercase font-mono">
            dev: Shashika Fernando
          </span>
        </div>
      </div>
      
      {/* RIGHT PANEL: LANDING CTA + LOGIN/SIGNUP CONNECTORS */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative overflow-hidden">
        {/* interactive glow blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF6B35]/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        
        <div className="w-full max-w-sm space-y-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-[#FF6B35] to-[#10B981] rounded-lg flex items-center justify-center text-white font-bold text-sm">AT</div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                <span className="bg-gradient-to-r from-[#FF6B35] to-[#10B981] bg-clip-text text-transparent">AlgoTrack</span>
              </h1>
            </div>
            <p className="text-sm text-slate-500">Practice at your own pace, keep records and revise...</p>
          </div>
          
          {/* Feature badges with unique animations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-[#FF6B35] transition-all duration-300 hover:scale-105 group">
              <div className="text-[#FF6B35] text-lg mb-1 group-hover:animate-bounce-subtle">⚡</div>
              <div className="text-xs font-semibold text-slate-700">Real-time</div>
              <div className="text-[10px] text-slate-400">Analytics</div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-[#10B981] transition-all duration-300 hover:scale-105 group">
              <div className="text-[#10B981] text-lg mb-1 group-hover:animate-bounce-subtle">🔒</div>
              <div className="text-xs font-semibold text-slate-700">Secure</div>
              <div className="text-[10px] text-slate-400">Infrastructure</div>
            </div>
          </div>
          
          {/* interactive 3D tilt cards for login / signup */}
          <div className="grid grid-cols-1 gap-3">
            {/* Login card */}
            <a href="/login" className="block w-full rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-5 transition-all duration-300 hover:border-[#FF6B35] hover:shadow-[0_0_30px_rgba(255,107,53,0.1)] group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#FF6B35] transition-colors">Access</div>
                  <div className="text-lg font-semibold text-slate-800 group-hover:text-[#FF6B35] transition-colors">Sign in →</div>
                  <p className="text-xs text-slate-400 mt-0.5">Developer credentials</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#FF6B35]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform group-hover:rotate-12">🔐</div>
              </div>
            </a>
            
            {/* Signup card */}
            <a href="/signup" className="block w-full rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-5 transition-all duration-300 hover:border-[#10B981] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] group">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#10B981] transition-colors">Onboard</div>
                  <div className="text-lg font-semibold text-slate-800 group-hover:text-[#10B981] transition-colors">Initialize →</div>
                  <p className="text-xs text-slate-400 mt-0.5">New profile setup</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#10B981]/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform group-hover:-rotate-12">🚀</div>
              </div>
            </a>
          </div>
          
          {/* divider with unique animation */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-slate-400 font-mono tracking-widest text-[10px] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[#FF6B35] animate-pulse"></span>
                CONNECTED
                <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" style={{ animationDelay: '0.5s' }}></span>
              </span>
            </div>
          </div>
          
          {/* stats with unique animations */}
          {/* <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#10B981] bg-clip-text text-transparent animate-count-up">99.9%</div>
              <div className="text-[10px] text-slate-400">Uptime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-700 animate-pulse-slow">1M+</div>
              <div className="text-[10px] text-slate-400">Requests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-700 animate-bounce-subtle">50ms</div>
              <div className="text-[10px] text-slate-400">Latency</div>
            </div>
          </div>
           */}
          <p className="text-center text-xs text-slate-400 pt-1 border-t border-slate-100/50">
            <span className="font-mono tracking-wide">© 2026 · Next-gen tracker</span>
          </p>
        </div>
      </div>
    </main>
  );
}