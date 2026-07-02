'use client';
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => void;
}

export function ImageUploadModal({ isOpen, onClose, onUpload }: ImageUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/notes/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      onUpload(data.url);
      onClose();
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fileEvent = { target: { files: [file] } } as any;
      handleFileSelect(fileEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
              <ImageIcon className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Upload Image</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#FF6B35] transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG, GIF up to 5MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto max-h-64 object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-1 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {selectedFile!.name} ({(selectedFile!.size / 1024).toFixed(0)} KB)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E04E1B] rounded-lg transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Image'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}