import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Toast } from '../components/Toast';

type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const MAX_TOASTS = 3;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    setToasts(prevToasts => {
      // Deduplicate: don't show the same message if it's already visible
      const isDuplicate = prevToasts.some(t => t.message === message && t.type === type);
      if (isDuplicate) return prevToasts;

      const id = Date.now();

      // Schedule auto-remove after 5s
      setTimeout(() => removeToast(id), 5000);

      const newToast = { id, message, type };
      const updatedToasts = [...prevToasts, newToast];

      // If we exceed MAX_TOASTS, remove the oldest ones to prevent flooding
      if (updatedToasts.length > MAX_TOASTS) {
        return updatedToasts.slice(updatedToasts.length - MAX_TOASTS);
      }
      return updatedToasts;
    });
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] w-full max-w-xs space-y-3">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};