import { useState } from 'react';

type ModalName =
  | 'newFile'
  | 'shortcuts'
  | 'helpMenu'
  | 'guide'
  | 'about'
  | 'settings'
  | 'preview'
  | 'aiPanel'
  | 'aiModal';

export function useModals() {
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [closeConfirmDialog, setCloseConfirmDialog] = useState<{ show: boolean; fileId: string | null }>({
    show: false,
    fileId: null
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: { name: string; path: string } } | null>(null);

  const openModal = (name: ModalName) => {
    const setters: Record<ModalName, (value: boolean) => void> = {
      newFile: setShowNewFileDialog,
      shortcuts: setShowShortcuts,
      helpMenu: setShowHelpMenu,
      guide: setShowGuideModal,
      about: setShowAboutModal,
      settings: setShowSettingsModal,
      preview: setShowPreviewModal,
      aiPanel: setShowAIPanel,
      aiModal: setShowAIModal
    };
    setters[name]?.(true);
  };

  const closeModal = (name: ModalName) => {
    const setters: Record<ModalName, (value: boolean) => void> = {
      newFile: setShowNewFileDialog,
      shortcuts: setShowShortcuts,
      helpMenu: setShowHelpMenu,
      guide: setShowGuideModal,
      about: setShowAboutModal,
      settings: setShowSettingsModal,
      preview: setShowPreviewModal,
      aiPanel: setShowAIPanel,
      aiModal: setShowAIModal
    };
    setters[name]?.(false);
  };

  const toggleModal = (name: ModalName) => {
    const getters: Record<ModalName, boolean> = {
      newFile: showNewFileDialog,
      shortcuts: showShortcuts,
      helpMenu: showHelpMenu,
      guide: showGuideModal,
      about: showAboutModal,
      settings: showSettingsModal,
      preview: showPreviewModal,
      aiPanel: showAIPanel,
      aiModal: showAIModal
    };
    if (getters[name]) {
      closeModal(name);
    } else {
      openModal(name);
    }
  };

  return {
    showNewFileDialog,
    setShowNewFileDialog,
    showShortcuts,
    setShowShortcuts,
    showHelpMenu,
    setShowHelpMenu,
    showGuideModal,
    setShowGuideModal,
    showAboutModal,
    setShowAboutModal,
    showSettingsModal,
    setShowSettingsModal,
    showPreviewModal,
    setShowPreviewModal,
    showAIPanel,
    setShowAIPanel,
    showAIModal,
    setShowAIModal,
    closeConfirmDialog,
    setCloseConfirmDialog,
    contextMenu,
    setContextMenu,
    openModal,
    closeModal,
    toggleModal
  };
}
