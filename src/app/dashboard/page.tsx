import React from 'react';

export default async function DashboardPage() {
  // Activity matrix profile map matching your mock database loop configuration arrays
  const pattern = [
    0,0,1,2,1,3,2,1,0,2,3,4,2,1,3,2,4,3,1,2,0,1,3,2,
    4,3,2,1,3,4,2,3,1,2,3,4,2,1,3,2,1,0,2,3,4,3,2,4,
    3,2,4,3,1,2,3,4,3,2,3,4,2,3,1,2,3,4,3,2,3,4,2,3,
    1,2,3,4,3,2,3,4,2,3,1,2
  ];

  const recentProblems = [
    { difficulty: 'Easy', name: 'Max avg subarray I', tag: 'Sliding window', class: 'bg-emerald-50 text-[#10B981] border-emerald-100/50' },
    { difficulty: 'Med', name: 'Longest substring no repeat', tag: 'Sliding window', class: 'bg-orange-50/60 text-[#FF6B35] border-orange-100/40' },
    { difficulty: 'Easy', name: 'Two sum', tag: 'Hashing', class: 'bg-emerald-50 text-[#10B981] border-emerald-100/50' },
    { difficulty: 'Hard', name: 'Trapping rain water', tag: 'Two pointers', class: 'bg-rose-50 text-rose-600 border-rose-100/60' },
    { difficulty: 'Med', name: 'Binary search rotated array', tag: 'Binary search', class: 'bg-orange-50/60 text-[#FF6B35] border-orange-100/40' },
  ];

  const topics = [
    { label: 'Arrays', count: 15, width: '75%', color: '#FF6B35' },         // Brand Orange primary emphasis
    { label: 'Sliding window', count: 8, width: '40%', color: '#10B981' },   // Brand Green accent path
    { label: 'Trees', count: 6, width: '30%', color: '#FF6B35' },
    { label: 'Binary search', count: 5, width: '25%', color: '#10B981' },
    { label: 'Dynamic prog.', count: 3, width: '15%', color: '#64748b' },    // Muted slate fallback
    { label: 'Graphs', count: 2, width: '10%', color: '#94a3b8' },
  ];

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW ACTION SYSTEM */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Workspace Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track algorithmic structures, sequence statistics, and execution streams.</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] text-white transition-all shadow-sm shadow-orange-500/10 cursor-pointer">
          <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Log problem
        </button>
      </div>

      {/* COMPACT STRATEGIC SCORECARD BLOCKS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">47</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Problems solved</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-emerald-50 text-[#10B981] font-bold border border-emerald-100/50">+3 this week</span>
        </div>
        
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">12</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Day streak</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-orange-50 text-[#FF6B35] font-bold border border-orange-100/50">Keep going!</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">68%</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Success rate</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-emerald-50 text-[#10B981] font-bold border border-emerald-100/50">↑ 5% vs last month</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">5</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Topics covered</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-slate-50 text-slate-500 font-bold border border-slate-200/60">9 remaining</span>
        </div>
      </div>

      {/* CORE PERFORMANCE MESH HEATMAP SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Activity Execution Flow — last 12 weeks</p>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
            <span>Less</span>
            <div className="w-2 h-2 rounded-[1px] bg-slate-100" />
            <div className="w-2 h-2 rounded-[1px] bg-emerald-100" />
            <div className="w-2 h-2 rounded-[1px] bg-emerald-300" />
            <div className="w-2 h-2 rounded-[1px] bg-[#10B981]" />
            <span>More</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="grid grid-cols-12 sm:grid-cols-[repeat(42,minmax(0,1fr))] gap-1">
            {pattern.map((value, idx) => (
              <div 
                key={idx} 
                className={`h-2.5 rounded-[2px] transition-all hover:scale-110 cursor-pointer hm-${value}`}
                title={`Commit weight payload value step index points: ${value}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DATA VISUALIZATION TWIN MATRIX LAYOUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Card: Verified Process Array Streams */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent problems</p>
          <div className="bg-white border border-slate-200/80 p-2.5 px-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] divide-y divide-slate-100 flex-1">
            {recentProblems.map((prob, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3 first:pt-1.5 last:pb-1.5 group">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase border shrink-0 min-w-[50px] text-center ${prob.class}`}>
                  {prob.difficulty}
                </span>
                <span className="text-xs font-semibold text-slate-700 flex-1 truncate group-hover:text-slate-900 transition-colors">
                  {prob.name}
                </span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                  {prob.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Balanced System Resource Distribution Bars */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Topic breakdown</p>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] space-y-3 flex-1 flex flex-col justify-between">
            {topics.map((topic, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 w-[90px] shrink-0 truncate">
                  {topic.label}
                </span>
                <div className="flex-1 h-2 bg-slate-50 border border-slate-100/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 shadow-inner" 
                    style={{ width: topic.width, backgroundColor: topic.color }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 w-7 text-center">
                  {topic.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}