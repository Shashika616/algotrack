'use join';
import { logProblem } from '../../lib/actions';

export default function LogProblemForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-medium text-slate-900 uppercase tracking-wider">Log New Problem</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <form action={logProblem} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Problem Title</label>
            <input 
              type="text" 
              name="title" 
              required 
              placeholder="e.g., Trapping Rain Water"
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[color:var(--color-brand)] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Topic / Pattern</label>
              <input 
                type="text" 
                name="topic" 
                required 
                placeholder="e.g., Two Pointers"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[color:var(--color-brand)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time Taken (mins)</label>
              <input 
                type="number" 
                name="timeTaken" 
                placeholder="e.g., 35"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[color:var(--color-brand)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Difficulty</label>
              <select name="difficulty" className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select name="status" className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 outline-none">
                <option value="solved">Solved</option>
                <option value="attempted">Attempted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Problem URL (Optional)</label>
            <input 
              type="url" 
              name="url" 
              placeholder="https://leetcode.com/problems/..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[color:var(--color-brand)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes & Key Insights</label>
            <textarea 
              name="notes" 
              rows={3} 
              placeholder="What was the trick? Space/Time complexity considerations..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[color:var(--color-brand)] resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="rounded-md bg-[color:var(--color-brand)] px-4 py-1.5 text-xs font-medium text-[color:var(--color-brand-light)] hover:bg-[color:var(--color-brand-dark)] transition-colors cursor-pointer"
            >
              Save Problem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}