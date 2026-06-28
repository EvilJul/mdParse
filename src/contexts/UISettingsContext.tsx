import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

interface UISettingsContextType {
  showFileSidebar: boolean;
  setShowFileSidebar: (show: boolean) => void;
  sidebarWidth: number;
  isDragging: boolean;
  startDragging: () => void;

  showNewFileDialog: boolean;
  setShowNewFileDialog: (show: boolean) => void;
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean | ((prev: boolean) => boolean)) => void;
  showGuideModal: boolean;
  setShowGuideModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;

  closeConfirmDialog: { show: boolean; fileId: string | null };
  setCloseConfirmDialog: (value: { show: boolean; fileId: string | null }) => void;

  contextMenu: { x: number; y: number; file: { name: string; path: string } } | null;
  setContextMenu: (menu: { x: number; y: number; file: { name: string; path: string } } | null) => void;
}

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isDragging, setIsDragging] = useState(false);

  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [closeConfirmDialog, setCloseConfirmDialog] = useState<{ show: boolean; fileId: string | null }>({
    show: false,
    fileId: null,
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: { name: string; path: string } } | null>(null);

  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setSidebarWidth(Math.max(150, Math.min(400, e.clientX)));
        rafId = null;
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isDragging]);

  const startDragging = useCallback(() => setIsDragging(true), []);

  return (
    <UISettingsContext.Provider value={{
      showFileSidebar,
      setShowFileSidebar,
      sidebarWidth,
      isDragging,
      startDragging,
      showNewFileDialog,
      setShowNewFileDialog,
      showShortcuts,
      setShowShortcuts,
      showGuideModal,
      setShowGuideModal,
      showSettingsModal,
      setShowSettingsModal,
      closeConfirmDialog,
      setCloseConfirmDialog,
      contextMenu,
      setContextMenu,
    }}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettingsContext() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettingsContext must be used within UISettingsProvider');
  }
  return context;
}
