// components/notes/RichTextEditor.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Palette,
  Highlighter,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  readOnly = false,
  onImageUpload 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Keep track of the last saved selection range so formatting functions don't lose focus
  const savedRangeRef = useRef<Range | null>(null);

  // Sync initial content only ONCE when mounting to prevent cursor resetting
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  // Save the user's cursor position whenever they type or click inside the editor
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  // Restore the selection back to where the cursor was before interacting with toolbar buttons
  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current && !readOnly) {
      onChange(editorRef.current.innerHTML);
      saveSelection();
    }
  };

  const execCommand = (command: string, value: string = '') => {
    if (readOnly) return;
    
    // Bring back focus and target the correct text range
    editorRef.current?.focus();
    restoreSelection();

    // Use modern standard alternative if fallback fails, or normal execution
    document.execCommand(command, false, value);
    
    // Re-save cursor details and emit state change upward
    saveSelection();
    handleContentChange();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    if (!onImageUpload) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        execCommand('insertImage', dataUrl);
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 150);

      const imageUrl = await onImageUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (imageUrl) {
        execCommand('insertImage', imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const insertImage = () => {
    if (readOnly) return;
    saveSelection();
    fileInputRef.current?.click();
  };

  const getFontSize = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return '3';
    const range = selection.getRangeAt(0);
    const parent = range.commonAncestorContainer.parentElement;
    if (!parent) return '3';
    const fontSize = window.getComputedStyle(parent).fontSize;
    return parseInt(fontSize) <= 12 ? '1' : parseInt(fontSize) <= 16 ? '3' : '6';
  };

  if (readOnly) {
    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm focus-within:border-slate-300 transition-all">
      {/* Image Upload Progress */}
      {isUploading && (
        <div className="px-3 py-2 bg-orange-50 border-b border-orange-100 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-1 bg-orange-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF6B35] transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#FF6B35] whitespace-nowrap">
              {uploadProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/70 border-b border-slate-200/60 sticky top-0 backdrop-blur-md z-20">
        {/* Text Formatting */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Bold"
        >
          <Bold className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Italic"
        >
          <Italic className="w-4 h-4 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Underline"
        >
          <Underline className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('justifyLeft'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('justifyCenter'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('justifyRight'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
          className="p-1.5 rounded-md hover:bg-slate-200/70 text-slate-600 transition-colors active:scale-95"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Font Size */}
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          onFocus={saveSelection}
          className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#FF6B35] font-medium text-slate-600 cursor-pointer"
          defaultValue={getFontSize()}
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="6">Large</option>
          <option value="7">Huge</option>
        </select>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Modernized Text Color Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { saveSelection(); setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); }}
            className={`p-1.5 rounded-md transition-colors ${showColorPicker ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200/70 text-slate-600'}`}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
              <div className="absolute top-full left-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                <p className="text-[10px] font-bold text-slate-400 px-1 mb-1.5 uppercase tracking-wider">Text Color</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['#000000', '#FF6B35', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        execCommand('foreColor', color);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-md border border-slate-200/60 shadow-sm hover:scale-110 active:scale-95 transition-all relative group"
                      style={{ backgroundColor: color }}
                    >
                      <span className="absolute inset-0 rounded-md ring-2 ring-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modernized Highlight Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { saveSelection(); setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); }}
            className={`p-1.5 rounded-md transition-colors ${showHighlightPicker ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-200/70 text-slate-600'}`}
            title="Highlight Text"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {showHighlightPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHighlightPicker(false)} />
              <div className="absolute top-full left-0 mt-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
                <p className="text-[10px] font-bold text-slate-400 px-1 mb-1.5 uppercase tracking-wider">Highlight</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {['#FEF08A', '#FFE4B5', '#FFD700', '#FFB6C1', '#98FB98', '#87CEEB', '#FFFFFF'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        execCommand('hiliteColor', color);
                        setShowHighlightPicker(false);
                      }}
                      className="w-6 h-6 rounded-md border border-slate-200/60 shadow-sm hover:scale-110 active:scale-95 transition-all relative group"
                      style={{ backgroundColor: color }}
                    >
                      {color === '#FFFFFF' && <span className="text-[9px] text-slate-400 font-medium flex items-center justify-center h-full">None</span>}
                      <span className="absolute inset-0 rounded-md ring-2 ring-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Image Upload Input Handling */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={insertImage}
            disabled={isUploading}
            className="p-1.5 rounded-md hover:bg-slate-200/60 text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
            title="Upload Image"
          >
            <Image className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fully Functional ContentEditable Container */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleContentChange}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="p-4 min-h-[220px] focus:outline-none prose prose-slate prose-sm max-w-none selection:bg-orange-100 overflow-y-auto"
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
}