// components/notes/SectionEditor.tsx
'use client';
import React from 'react';
import { RichTextEditor } from './RichTextEditor';

interface SectionEditorProps {
  section: {
    id: string;
    title: string;
    content: string;
  };
  onUpdate: (updates: { title?: string; content?: string }) => void;
  readOnly?: boolean;
}

export function SectionEditor({ section, onUpdate, readOnly = false }: SectionEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Section Title
        </label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter section title..."
          disabled={readOnly}
          className="w-full px-3 py-1.5 text-sm border border-slate-200/80 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B35] disabled:bg-slate-50 disabled:text-slate-600 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Content
        </label>
        <RichTextEditor
          content={section.content}
          onChange={(content) => onUpdate({ content })}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}