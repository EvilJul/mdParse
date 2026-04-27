export const generateFileId = () => Math.random().toString(36).substring(2, 9);

export const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
