'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Save, X, Plus, Trash2, GripVertical } from 'lucide-react';
import { RichTextEditor } from '../../../../components/notes/RichTextEditor';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';

interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Note {
  id: string;
  userId: string;
  title: string;
  topic: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedTopic, setEditedTopic] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Delete section confirmation state
  const [deleteSectionModal, setDeleteSectionModal] = useState<{
    isOpen: boolean;
    sectionId: string | null;
    sectionTitle: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    sectionId: null,
    sectionTitle: '',
    isDeleting: false,
  });

  // Save confirmation state
  const [saveModal, setSaveModal] = useState<{
    isOpen: boolean;
    isSaving: boolean;
  }>({
    isOpen: false,
    isSaving: false,
  });

  // Unsaved changes warning state
  const [unsavedModal, setUnsavedModal] = useState<{
    isOpen: boolean;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    onConfirm: null,
  });

  useEffect(() => {
    if (id) {
      fetchNote();
    }
  }, [id]);

  const fetchNote = async () => {
    if (!id) {
      setError('Note ID is required');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/notes/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch note');
      }
      
      const data = await response.json();
      setNote(data);
      setEditedTitle(data.title);
      setEditedTopic(data.topic);
      setSections(data.sections || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching note:', error);
      setError(error instanceof Error ? error.message : 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Image upload handler - calls the API route
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/notes/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!note) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          topic: editedTopic,
          sections: sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save note');
      }

      const updatedNote = await response.json();
      setNote(updatedNote);
      setSections(updatedNote.sections || []);
      setIsEditing(false);
      setSaveModal({ isOpen: false, isSaving: false });
    } catch (error) {
      console.error('Error saving note:', error);
      setError(error instanceof Error ? error.message : 'Failed to save changes');
      setSaveModal({ isOpen: false, isSaving: false });
    } finally {
      setIsSaving(false);
    }
  };

  const openSaveConfirmation = () => {
    setSaveModal({ isOpen: true, isSaving: false });
  };

  const confirmSave = () => {
    setSaveModal(prev => ({ ...prev, isSaving: true }));
    handleSave();
  };

  const openDeleteSectionModal = (sectionId: string, sectionTitle: string) => {
    setDeleteSectionModal({
      isOpen: true,
      sectionId,
      sectionTitle,
      isDeleting: false,
    });
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionModal.sectionId) return;

    setDeleteSectionModal(prev => ({ ...prev, isDeleting: true }));

    try {
      setSections(sections.filter(section => section.id !== deleteSectionModal.sectionId));
      setDeleteSectionModal({ isOpen: false, sectionId: null, sectionTitle: '', isDeleting: false });
    } catch (error) {
      console.error('Error deleting section:', error);
      setDeleteSectionModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleAddSection = () => {
    const newSection: Section = {
      id: `temp-${Date.now()}`,
      title: 'New Section',
      content: '',
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleBack = () => {
    if (isEditing) {
      setUnsavedModal({
        isOpen: true,
        onConfirm: () => {
          setUnsavedModal({ isOpen: false, onConfirm: null });
          router.back();
        },
      });
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sm text-slate-400">Loading note...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-sm text-red-500">{error || 'Note not found'}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold bg-[#FF6B35] text-white rounded-lg hover:bg-[#E04E1B] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const topics = [
    'Algorithms', 'Data Structures', 'System Design', 'Database',
    'Frontend', 'Backend', 'DevOps', 'Machine Learning', 'General', 'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={handleBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <div className="min-w-0 flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg font-bold text-slate-900 bg-transparent border-b-2 border-[#FF6B35] focus:outline-none w-full"
              />
            ) : (
              <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate">{note.title}</h1>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing ? (
                <select
                  value={editedTopic}
                  onChange={(e) => setEditedTopic(e.target.value)}
                  className="text-xs text-slate-400 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#FF6B35]"
                >
                  {topics.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              ) : (
                <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60">
                  {note.topic}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(note.title);
                  setEditedTopic(note.topic);
                  setSections(note.sections || []);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 inline mr-1" />
                Cancel
              </button>
              <button
                onClick={openSaveConfirmation}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E04E1B] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-500/10"
              >
                <Save className="w-3.5 h-3.5 inline mr-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5 inline mr-1" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Sections */}
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                {isEditing && (
                  <div className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                )}
                {isEditing ? (
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                    className="text-sm font-semibold text-slate-700 bg-transparent border-b border-slate-300 focus:outline-none focus:border-[#FF6B35] flex-1"
                  />
                ) : (
                  <h3 className="text-sm font-semibold text-slate-700">{section.title}</h3>
                )}
              </div>
              {isEditing && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => openDeleteSectionModal(section.id, section.title)}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* ✅ RichTextEditor with image upload */}
            <RichTextEditor
              content={section.content}
              onChange={(content) => handleUpdateSection(section.id, { content })}
              readOnly={!isEditing}
              onImageUpload={handleImageUpload}
            />
          </div>
        ))}

        {/* Add Section Button */}
        {isEditing && (
          <button
            onClick={handleAddSection}
            className="w-full py-3 text-sm font-medium text-slate-400 hover:text-[#FF6B35] bg-slate-50 hover:bg-orange-50/50 border-2 border-dashed border-slate-200 hover:border-[#FF6B35] rounded-xl transition-all"
          >
            <Plus className="w-4 h-4 inline mr-1.5" />
            Add Section
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Created: {formatDate(note.createdAt)}</span>
        <span>Last updated: {formatDate(note.updatedAt)}</span>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={saveModal.isOpen}
        onClose={() => setSaveModal({ isOpen: false, isSaving: false })}
        onConfirm={confirmSave}
        title="Save Changes"
        message="This will save all your changes to the note and its sections. The content will be updated in your database."
        confirmText={saveModal.isSaving ? 'Saving...' : 'Save Changes'}
        cancelText="Cancel"
        type="success"
        isLoading={saveModal.isSaving}
      />

      <ConfirmationModal
        isOpen={deleteSectionModal.isOpen}
        onClose={() => setDeleteSectionModal({ isOpen: false, sectionId: null, sectionTitle: '', isDeleting: false })}
        onConfirm={handleDeleteSection}
        title="Delete Section"
        message={`Are you sure you want to delete "${deleteSectionModal.sectionTitle}"? All content in this section will be permanently removed.`}
        confirmText={deleteSectionModal.isDeleting ? 'Deleting...' : 'Delete Section'}
        cancelText="Cancel"
        type="danger"
        isLoading={deleteSectionModal.isDeleting}
      />

      <ConfirmationModal
        isOpen={unsavedModal.isOpen}
        onClose={() => setUnsavedModal({ isOpen: false, onConfirm: null })}
        onConfirm={() => {
          if (unsavedModal.onConfirm) {
            unsavedModal.onConfirm();
          }
        }}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmText="Leave Anyway"
        cancelText="Stay and Save"
        type="warning"
      />
    </div>
  );
}