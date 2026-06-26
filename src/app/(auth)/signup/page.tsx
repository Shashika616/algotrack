import { signup } from '../../../lib/actions';
import Link from 'next/link';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen bg-slate-50 antialiased font-sans">
      
      {/* LEFT PANEL: Light Green Core Brand Gradient Layout Container */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden select-none border-r border-emerald-100 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-[#10B981]/15">
        
        {/* Soft layout blueprint lines */}
        <div className="absolute inset-0 opacity-[0.25] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Brand Core Header Logo */}
        <div className="flex items-center gap-2 text-slate-800 relative z-10 font-sans font-bold tracking-tight text-sm">
          <span className="text-[#10B981]">💻</span> AlgoTrack
        </div>

        {/* Central Complex: Distributed System Architecture Mapping Topology */}
        <div className="relative z-10 mx-auto my-auto flex items-center justify-center w-full overflow-visible scale-95 xl:scale-110">
          
          <div className="relative w-[480px] h-[240px] flex items-center text-slate-700">
            
            {/* VECTOR CONNECTOR BUS NETWORK PATHS */}
            <svg className="absolute inset-0 w-full h-full stroke-slate-200 stroke-[2] fill-none -z-10">
              <path d="M 35,120 L 100,120 M 144,120 L 175,120 M 219,120 L 250,120" />
              <path d="M 294,120 L 305,120 M 305,120 L 325,50 M 305,120 L 325,190" />
              <path d="M 373,50 L 415,50" />
              <path d="M 373,190 L 415,190" />
              <path d="M 439,94 L 439,146" className="stroke-slate-200/60 stroke-dasharray-[4]" />
            </svg>

            {/* LIVE HARDWARE-ACCELERATED PACKET NODES */}
            <div className="absolute top-0 left-0 h-3 w-3 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] z-30 animate-light-request -ml-1.5 -mt-1.5" />
            <div className="absolute top-0 left-0 h-3 w-3 rounded-full bg-[#FF6B35] shadow-[0_0_10px_#FF6B35] z-30 animate-light-miss -ml-1.5 -mt-1.5" />

            {/* NODE 1: Terminal Stickman Client Component */}
            <div className="absolute left-0 h-11 w-11 border border-slate-200 bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-500 stroke-[2]">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
            </div>

            {/* NODE 2: Load Balancer Stack */}
            <div className="absolute left-[100px] h-11 w-11 border border-slate-200 bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-500 stroke-[2]">
                <path d="M12 22V2M5 12h14M5 7l-3 5 3 5M19 7l3 5-3 5" />
              </svg>
            </div>

            {/* NODE 3: Edge API Gateway */}
            <div className="absolute left-[175px] h-11 w-11 border border-[#FF6B35] bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#FF6B35] stroke-[2]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 10h6M9 14h6M12 6v12" />
              </svg>
            </div>

            {/* NODE 4: Message Broker Queue Cluster */}
            <div className="absolute left-[250px] h-11 w-11 border border-slate-200 bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-500 stroke-[2]">
                <path d="M3 6h18M3 12h18M3 18h18M7 3v18M17 3v18" />
              </svg>
            </div>

            {/* NODE 5: Microservice Instances */}
            {/* Microservice Container 1 (Top Cache Engine Route) */}
            <div className="absolute left-[325px] top-[28px] h-11 w-12 border border-slate-200 bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-500 stroke-[2]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
            </div>
            {/* Microservice Container 2 (Bottom Storage Fallback Route) */}
            <div className="absolute left-[325px] bottom-[28px] h-11 w-12 border border-slate-200 bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-500 stroke-[2]">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
            </div>

            {/* NODE 6: High-Performance Memory Cache Tier */}
            <div className="absolute left-[415px] top-[28px] h-11 w-11 border border-[#10B981] bg-white rounded-lg flex items-center justify-center animate-light-node shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#10B981] stroke-[2]">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>

            {/* NODE 7: Relational Database Storage Array */}
            <div className="absolute left-[415px] bottom-[28px] h-11 w-11 border border-slate-200 bg-white rounded-lg flex flex-col items-center justify-center animate-light-node shadow-sm gap-0.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-slate-400 stroke-[2]">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
              </svg>
            </div>

          </div>

        </div>

        {/* Minimal Light Base Footer Signature */}
        <div className="text-[11px] font-mono text-slate-400 relative z-10 flex items-center justify-between border-t border-slate-200/60 pt-4 px-4">
          <span>DISTRIBUTED INFRASTRUCTURE // MESH</span>
          <span className="text-slate-500 font-bold tracking-wide uppercase font-mono">
            dev: Shashika Fernando
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Form Box */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Initialize profile</h1>
            <p className="text-xs text-slate-500">Configure your algorithmic index credentials to get started.</p>
          </div>

          <form action={signup} className="space-y-4">
            {error && <div className="p-3 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded-lg">⚠️ {error}</div>}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input type="email" name="email" required placeholder="developer@algoplatform.com" className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#10B981] focus:bg-white transition-all shadow-inner" />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input type="password" name="password" required placeholder="••••••••••••" className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#10B981] focus:bg-white transition-all shadow-inner" />
            </div>

            <button type="submit" className="w-full rounded-lg bg-[#10B981] hover:bg-[#059669] text-white py-2.5 text-xs font-semibold shadow-md shadow-emerald-500/10 transition-all cursor-pointer block text-center">
              Generate Developer Profile
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-slate-400">Already initialized?</span></div>
          </div>

          <p className="text-center text-xs text-slate-500">
            Have an account already? <Link href="/login" className="text-[#10B981] font-bold hover:underline transition-all">Log in here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}