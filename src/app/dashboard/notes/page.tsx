// app/dashboard/notes/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, Calendar, Trash2 } from 'lucide-react';
import { CreateNoteModal } from '../../../components/notes/CreateNoteModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

interface Note {
  id: string;
  userId: string;
  title: string;
  topic: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sections: any[];
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Delete confirmation state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    noteId: string | null;
    noteTitle: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    noteId: null,
    noteTitle: '',
    isDeleting: false,
  });

  const notesPerPage = 10;

  useEffect(() => {
    fetchNotes();
  }, [currentPage, searchTerm]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notes?page=${currentPage}&limit=${notesPerPage}&search=${encodeURIComponent(searchTerm)}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      setNotes(data.notes);
      setTotalPages(data.totalPages);
      setTotalNotes(data.total);
      setError(null);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (title: string, topic: string) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic }),
      });

      if (!response.ok) throw new Error('Failed to create note');

      const newNote = await response.json();
      await fetchNotes();
      setIsModalOpen(false);
      router.push(`/dashboard/notes/${newNote.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note');
    }
  };

  // ✅ Open delete confirmation
  const openDeleteModal = (noteId: string, noteTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      noteId,
      noteTitle,
      isDeleting: false,
    });
  };

  // ✅ Handle delete confirmation
  const handleDeleteNote = async () => {
    if (!deleteModal.noteId) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      const response = await fetch(`/api/notes/${deleteModal.noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      await fetchNotes();
      setDeleteModal({ isOpen: false, noteId: null, noteTitle: '', isDeleting: false });
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase() || '📝';
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sm text-slate-400">Loading notes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-sm text-red-500">{error}</div>
        <button 
          onClick={fetchNotes}
          className="px-4 py-2 text-xs font-semibold bg-[#FF6B35] text-white rounded-lg hover:bg-[#E04E1B] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Saved Notes</h1>
          <p className="text-xs text-slate-400 mt-0.5">Organize your thoughts, solutions, and study materials</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF6B35] hover:bg-[#E04E1B] text-white transition-all shadow-sm shadow-orange-500/10 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Note
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search notes by title or topic..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200/80 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B35] transition-all"
        />
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-400">
            {searchTerm ? 'No notes match your search' : 'No notes yet. Create your first note!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div 
              key={note.id}
              onClick={() => router.push(`/dashboard/notes/${note.id}`)}
              className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-all cursor-pointer group relative"
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
                    onClick={(e) => openDeleteModal(note.id, note.title, e)}
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
                    {note.sections && note.sections.length > 0 && (
                      <span className="text-slate-400">
                        {note.sections.length} section{note.sections.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF6B35] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            Showing {((currentPage - 1) * notesPerPage) + 1} to{' '}
            {Math.min(currentPage * notesPerPage, totalNotes)} of {totalNotes} notes
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200/60 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200/60 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateNote}
      />

      {/* ✅ Custom Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, noteId: null, noteTitle: '', isDeleting: false })}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteModal.noteTitle}"? This action cannot be undone and all sections will be permanently removed.`}
        confirmText={deleteModal.isDeleting ? 'Deleting...' : 'Delete Note'}
        cancelText="Cancel"
        type="danger"
        isLoading={deleteModal.isDeleting}
      />
    </div>
  );
}