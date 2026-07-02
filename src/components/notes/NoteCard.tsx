'use client';
import React from 'react';
import { FileText, Calendar, Trash2, ChevronRight } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  topic: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sections: any[];
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
}

export function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  const getInitials = (title: string) => {
    return title
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase() || '📝';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-all cursor-pointer group relative"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-sm shrink-0">
              {getInitials(note.title)}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              {note.title}
            </h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mb-3">
          <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60">
            {note.topic}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(note.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {note.sections.length > 0 && (
              <span className="text-slate-400">
                {note.sections.length} section{note.sections.length > 1 ? 's' : ''}
              </span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF6B35] transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}