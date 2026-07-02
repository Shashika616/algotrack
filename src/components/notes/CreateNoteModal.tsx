'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, topic: string) => void;
}

const topics = [
  'Algorithms',
  'Data Structures',
  'System Design',
  'Database',
  'Frontend',
  'Backend',
  'DevOps',
  'Machine Learning',
  'General',
  'Other'
];

export function CreateNoteModal({ isOpen, onClose, onCreate }: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !topic) return;

    setIsSubmitting(true);
    await onCreate(title.trim(), topic);
    setTitle('');
    setTopic('');
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200/80 p-6 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        <h2 className="text-lg font-bold text-slate-900 mb-1">Create New Note</h2>
        <p className="text-xs text-slate-400 mb-5">Start organizing your thoughts and learnings</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Note Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="w-full px-3 py-2 text-sm border border-slate-200/80 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B35] transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-xs font-semibold text-slate-600 mb-1.5">
              Topic
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200/80 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B35] transition-all"
              required
            >
              <option value="">Select a topic...</option>
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !topic}
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E04E1B] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/10"
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}