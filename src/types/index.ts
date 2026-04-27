export type TabType = 'editor' | 'guide' | 'about';
export type ThemeType = 'light' | 'dark';

export interface FileState {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  filePath?: string;
}

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

export interface AIAdvancedSettings {
  systemPrompt: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  file: { name: string; path: string };
}
