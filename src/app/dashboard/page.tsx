'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboard } from '../../context/DashboardContext';

interface DashboardStats {
  totalSolved: number;
  streak: number;
  successRate: number;
  topicsCovered: number;
  topicsRemaining: number;
  pattern: number[];
  recentProblems: {
    difficulty: string;
    name: string;
    tag: string;
    status: string;
    problemId?: string; 
    topicId?: string; 
  }[];
  topicBreakdown: {
    label: string;
    count: number;
    width: string;
    color: string;
    topicId?: string | null; 
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { navigateToProblem, navigateToTopic } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyStyles = (difficulty: string, status?: string) => {
    if (status === 'solved') {
      return 'bg-emerald-50 text-[#10B981] border-emerald-100/50';
    }
    if (status === 'reviewed') {
      return 'bg-blue-50 text-blue-600 border-blue-100/50';
    }
    switch (difficulty) {
      case 'Easy': return 'bg-emerald-50 text-[#10B981] border-emerald-100/50';
      case 'Med': return 'bg-orange-50/60 text-[#FF6B35] border-orange-100/40';
      case 'Hard': return 'bg-rose-50 text-rose-600 border-rose-100/60';
      default: return 'bg-slate-50 text-slate-600 border-slate-200/60';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'solved':
        return <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-[#10B981]">✓ Solved</span>;
      case 'reviewed':
        return <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">↻ Reviewed</span>;
      default:
        return <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400">Attempted</span>;
    }
  };

  // Navigation functions using the context
  const handleProblemClick = (problemId: string, problemName: string) => {
    if (!problemId) return;
    navigateToProblem(problemId, problemName);
    router.push('/dashboard/problems');
  };

  const handleTopicClick = (topicId: string, topicName: string) => {
    if (!topicId) return;
    navigateToTopic(topicId, topicName);
    router.push('/dashboard/problems');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sm text-slate-400">Loading dashboard data...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-sm text-red-500">{error || 'No data available'}</div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 text-xs font-semibold bg-[#FF6B35] text-white rounded-lg hover:bg-[#E04E1B] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER ROW ACTION SYSTEM */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Workspace Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track algorithmic structures, sequence statistics, and execution streams.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard/problems')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] text-white transition-all shadow-sm shadow-orange-500/10 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Log problem
        </button>
      </div>

      {/* COMPACT STRATEGIC SCORECARD BLOCKS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalSolved}</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Problems solved</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-emerald-50 text-[#10B981] font-bold border border-emerald-100/50">
            {stats.totalSolved > 0 ? 'Keep going!' : 'Start solving!'}
          </span>
        </div>
        
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.streak}</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Day streak</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-orange-50 text-[#FF6B35] font-bold border border-orange-100/50">
            {stats.streak > 0 ? 'Keep going!' : 'Start a streak!'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.successRate}%</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Success rate</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-emerald-50 text-[#10B981] font-bold border border-emerald-100/50">
            {stats.successRate >= 70 ? '↑ Great!' : stats.successRate > 0 ? 'Keep practicing' : 'Start solving'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] relative overflow-hidden group">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{stats.topicsCovered}</div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">Topics covered</div>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md mt-2 bg-slate-50 text-slate-500 font-bold border border-slate-200/60">
            {stats.topicsRemaining} remaining
          </span>
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
            {stats.pattern.map((value, idx) => (
              <div 
                key={idx} 
                className={`h-2.5 rounded-[2px] transition-all hover:scale-110 cursor-pointer hm-${value}`}
                title={`Activity level: ${value}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DATA VISUALIZATION TWIN MATRIX LAYOUTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Left Card: Recent Problems */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent problems</p>
          <div className="bg-white border border-slate-200/80 p-2.5 px-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] divide-y divide-slate-100 flex-1">
            {stats.recentProblems.length > 0 ? (
              stats.recentProblems.map((prob, idx) => (
                <div 
                  key={idx} 
                  onClick={() => prob.problemId && handleProblemClick(prob.problemId, prob.name)}
                  className="flex items-center gap-3 py-3 first:pt-1.5 last:pb-1.5 group cursor-pointer hover:bg-slate-50/60 rounded-lg transition-colors px-2 -mx-2"
                >
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wide uppercase border shrink-0 min-w-[50px] text-center ${getDifficultyStyles(prob.difficulty, prob.status)}`}>
                    {prob.difficulty}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 flex-1 truncate group-hover:text-slate-900 transition-colors">
                    {prob.name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                    {prob.tag}
                  </span>
                  {getStatusBadge(prob.status)}
                  <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No problems attempted yet. Start practicing!
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Topic Breakdown */}
        <div className="flex flex-col">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Topic breakdown</p>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] space-y-3 flex-1 flex flex-col justify-between">
            {stats.topicBreakdown.length > 0 ? (
              stats.topicBreakdown.map((topic, idx) => (
                <div 
                  key={idx} 
                  onClick={() => topic.topicId && handleTopicClick(topic.topicId, topic.label)}
                  className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50/60 rounded-lg transition-colors px-2 py-1 -mx-2"
                >
                  <span className="text-xs font-semibold text-slate-600 w-[90px] shrink-0 truncate group-hover:text-slate-900 transition-colors">
                    {topic.label}
                  </span>
                  <div className="flex-1 h-2 bg-slate-50 border border-slate-100/70 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700 shadow-inner" 
                      style={{ width: topic.width, backgroundColor: topic.color }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 w-7 text-center group-hover:bg-slate-100 transition-colors">
                    {topic.count}
                  </span>
                  <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No topics data available
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}