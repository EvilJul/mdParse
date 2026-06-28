export type TabType = 'editor' | 'guide';
export type ThemeType = 'light' | 'dark';

export interface FileState {
  id: string;
  name: string;
  content: string;
  isDirty: boolean;
  filePath?: string;
}


