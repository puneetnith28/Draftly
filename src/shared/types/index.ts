export type BlockType =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'ul' | 'ol' | 'quote' | 'code' | 'hr'
  | 'table' | 'p';

export interface ParsedBlock {
  id: string;
  type: BlockType;
  text: string;
  raw: string;
  language?: string;
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
