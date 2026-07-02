// components/ui/ConfirmationModal.tsx
'use client';
import React from 'react';
import { X, AlertTriangle, Trash2, Save, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-red-500" />,
          iconBg: 'bg-red-50 border-red-100',
          confirmBg: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
          iconBg: 'bg-orange-50 border-orange-100',
          confirmBg: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
        };
      case 'info':
        return {
          icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
          iconBg: 'bg-blue-50 border-blue-100',
          confirmBg: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
        };
      case 'success':
        return {
          icon: <Save className="w-5 h-5 text-emerald-500" />,
          iconBg: 'bg-emerald-50 border-emerald-100',
          confirmBg: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500',
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
          iconBg: 'bg-blue-50 border-blue-100',
          confirmBg: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${styles.iconBg} border`}>
              {styles.icon}
            </div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
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
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 bg-slate-50/50 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-all shadow-sm focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${styles.confirmBg}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}