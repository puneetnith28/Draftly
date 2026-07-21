import { BlockEntity } from '../../domain/entities/Block';
import { ParsedBlock } from '@shared/types';
import { ExportStrategy } from '../../domain/strategies/ExportStrategy';
import React from 'react';

export interface PluginContext {
  registerBlockType(
    type: string, 
    creator: (text: string, ...args: any[]) => BlockEntity, 
    reconstituter: (data: ParsedBlock) => BlockEntity
  ): void;
  registerExporter(format: string, exporter: ExportStrategy): void;
  registerBlockComponent(type: string, component: React.ComponentType<any>): void;
  registerSlashMenuItem(type: string, label: string, icon: string): void;
}

export interface IDraftlyPlugin {
  id: string;
  name: string;
  onInit(context: PluginContext): void;
}
