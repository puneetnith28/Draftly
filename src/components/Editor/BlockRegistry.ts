import React from 'react';

export const BlockRegistry = new Map<string, React.ComponentType<any>>();

export interface SlashMenuItem {
  label: string;
  icon: string;
}

export const SlashMenuRegistry = new Map<string, SlashMenuItem>();
