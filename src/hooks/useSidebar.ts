import { useState, useEffect } from 'react';

export function useSidebar() {
  const [showFileSidebar, setShowFileSidebar] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        const newWidth = Math.max(150, Math.min(400, e.clientX));
        setSidebarWidth(newWidth);
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

  const toggleSidebar = () => setShowFileSidebar(prev => !prev);
  const startDragging = () => setIsDragging(true);

  return {
    showFileSidebar,
    setShowFileSidebar,
    sidebarWidth,
    isDragging,
    toggleSidebar,
    startDragging
  };
}
