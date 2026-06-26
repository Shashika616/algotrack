import { login } from '../../../lib/actions';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-screen bg-slate-50 antialiased font-sans">
      
      {/* LEFT PANEL: High-Spread Visual Vector Tree Map with Light Orange Gradient */}
      <div className="hidden lg:flex lg:w-1/2 p-8 flex-col justify-between relative overflow-hidden select-none border-r border-orange-100 bg-gradient-to-b from-orange-50/60 via-slate-50 to-[#FF6B35]/15">
        
        {/* Crisp vector blueprint grids */}
        <div className="absolute inset-0 opacity-[0.25] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Brand Core Header Logo */}
        <div className="flex items-center gap-2 text-slate-800 relative z-10 font-sans font-bold tracking-tight text-sm px-4 pt-4">
          <span className="text-[#FF6B35]">💻</span> AlgoTrack
        </div>

        {/* Central Complex: Fully Spaced Vector Graph Area */}
        <div className="relative w-full max-w-lg xl:max-w-xl mx-auto my-auto aspect-[4/3] flex items-center justify-center overflow-visible">
          
          <svg 
            viewBox="0 0 440 280" 
            className="w-full h-full overflow-visible fill-none stroke-none svg-tree-net"
          >
            {/* BACKGROUND INFRASTRUCTURE CONNECTOR LINKS */}
            <line x1="220" y1="40" x2="100" y2="120" className="stroke-slate-200 stroke-[1.5]" />
            <line x1="220" y1="40" x2="340" y2="120" className="stroke-slate-200 stroke-[1.5]" />
            <line x1="100" y1="120" x2="40" y2="220" className="stroke-slate-200 stroke-[1.5]" />
            <line x1="100" y1="120" x2="160" y2="220" className="stroke-slate-200 stroke-[1.5]" />
            <line x1="340" y1="120" x2="280" y2="220" className="stroke-slate-200 stroke-[1.5]" />
            <line x1="340" y1="120" x2="400" y2="220" className="stroke-slate-200 stroke-[1.5]" />

            {/* ANIMATED FLUID PAYLOAD SIGNALS SCANNING EVERY BRANCH */}
            <path d="M 220,40 L 100,120 L 40,220" className="path-pulse-line stroke-[2]" style={{ animationDelay: '0s' }} />
            <path d="M 220,40 L 100,120 L 160,220" className="path-pulse-line stroke-[2]" style={{ animationDelay: '0.4s' }} />
            <path d="M 220,40 L 340,120 L 280,220" className="path-pulse-line stroke-[2]" style={{ animationDelay: '0.2s' }} />
            <path d="M 220,40 L 340,120 L 400,220" className="path-pulse-line stroke-[2]" style={{ animationDelay: '0.6s' }} />

            {/* RENDERING NATIVE HTML-BACKED NODE SHELLS */}
            {/* Tier 0: Center Root */}
            <foreignObject x="194" y="14" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-root-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
            </foreignObject>

            {/* Tier 1: Spaced Left & Right Midpoints */}
            <foreignObject x="74" y="94" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier1-pulse" style={{ animationDelay: '0.3s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
            </foreignObject>
            <foreignObject x="314" y="94" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier1-pulse" style={{ animationDelay: '0.6s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
            </foreignObject>

            {/* Tier 2: Widescreen Base Grandchildren */}
            <foreignObject x="14" y="194" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier2-pulse" style={{ animationDelay: '0.8s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            </foreignObject>
            <foreignObject x="134" y="194" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier2-pulse" style={{ animationDelay: '1.1s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            </foreignObject>
            <foreignObject x="254" y="194" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier2-pulse" style={{ animationDelay: '1.4s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            </foreignObject>
            <foreignObject x="374" y="194" width="52" height="52" className="overflow-visible">
              <div className="h-12 w-12 rounded-full border border-slate-200 bg-white flex items-center justify-center node-tier2-pulse" style={{ animationDelay: '1.7s' }}>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              </div>
            </foreignObject>
          </svg>

        </div>

        {/* Signature Baseline Footer Component */}
        <div className="text-[11px] font-mono text-slate-400 relative z-10 flex items-center justify-between border-t border-slate-200/60 px-4 pt-4">
          <span>O(LOG N) MATRIX // VISUALIZER</span>
          <span className="text-slate-500 font-bold tracking-wide uppercase font-mono">
            dev: Shashika Fernando
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Form Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to workspace</h1>
            <p className="text-xs text-slate-500">Enter your developer credentials below to synchronize stats.</p>
          </div>

          <form action={login} className="space-y-4">
            {error && <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">⚠️ {error}</div>}
            {message && <div className="p-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">✉️ {message}</div>}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" required placeholder="developer@algoplatform.com" className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#FF6B35] focus:bg-white transition-all shadow-inner" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input type="password" name="password" required placeholder="••••••••••••" className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#FF6B35] focus:bg-white transition-all shadow-inner" />
            </div>

            <button type="submit" className="w-full rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] text-white py-2.5 text-xs font-semibold shadow-md shadow-orange-500/10 transition-all cursor-pointer block text-center">
              Access Dashboard
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">Account initialization</span></div>
          </div>

          <p className="text-center text-xs text-slate-500">
            Don't have a tracking account? <Link href="/signup" className="text-[#FF6B35] font-bold hover:underline transition-all">Create an account free</Link>
          </p>
        </div>
      </div>
    </main>
  );
}