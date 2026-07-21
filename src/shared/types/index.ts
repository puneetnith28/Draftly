export type BlockType = string;

export interface ParsedBlock {
  id: string;
  type: BlockType;
  text: string;
  raw: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export type FontFamily = 'fraunces' | 'inter';
export type ContentWidth = 'narrow' | 'medium' | 'wide';
export type ColorTheme = 'light' | 'dark' | 'sepia';

export interface Preferences {
  font: FontFamily;
  width: ContentWidth;
  theme: ColorTheme;
}
