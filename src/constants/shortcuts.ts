const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD_KEY = isMac ? '⌘' : 'Ctrl';

export const SHORTCUTS = [
  { keys: `${MOD_KEY}+N`, action: '新建文件' },
  { keys: `${MOD_KEY}+S`, action: '保存文件' },
  { keys: `${MOD_KEY}+Shift+S`, action: '另存为' },
  { keys: `${MOD_KEY}+O`, action: '打开文件' },
  { keys: `${MOD_KEY}+Shift+O`, action: '打开文件夹' },
  { keys: `${MOD_KEY}+W`, action: '关闭文件' },
  { keys: `${MOD_KEY}+Shift+T`, action: '切换主题' },
  { keys: `${MOD_KEY}+?`, action: '显示快捷键' },
  { keys: '', action: '' },
  { keys: `${MOD_KEY}+B`, action: '粗体' },
  { keys: `${MOD_KEY}+I`, action: '斜体' },
  { keys: `${MOD_KEY}+K`, action: '插入链接' },
  { keys: `${MOD_KEY}+\``, action: '行内代码' },
  { keys: `${MOD_KEY}+1`, action: '一级标题' },
  { keys: `${MOD_KEY}+2`, action: '二级标题' },
  { keys: `${MOD_KEY}+3`, action: '三级标题' },
  { keys: '', action: '' },
  { keys: 'Esc', action: '关闭弹窗' },
];

export const isMacPlatform = isMac;
