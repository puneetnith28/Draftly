import { IDraftlyPlugin, PluginContext } from './IDraftlyPlugin';
import { BlockFactory } from '../../domain/factories/BlockFactory';
import { ExportService } from '../../application/services/ExportService';
import { BlockRegistry, SlashMenuRegistry } from '../../components/Editor/BlockRegistry';

export class PluginManager {
  private static plugins = new Map<string, IDraftlyPlugin>();

  public static registerPlugin(plugin: IDraftlyPlugin) {
    if (this.plugins.has(plugin.id)) return;
    
    this.plugins.set(plugin.id, plugin);
    
    const context: PluginContext = {
      registerBlockType: (type, creator, reconstituter) => {
        BlockFactory.registerCustomBlockType(type, creator, reconstituter);
      },
      registerExporter: (format, exporter) => {
        ExportService.registerStrategy(format, exporter);
      },
      registerBlockComponent: (type, component) => {
        BlockRegistry.set(type, component);
      },
      registerSlashMenuItem: (type, label, icon) => {
        SlashMenuRegistry.set(type, { label, icon });
      }
    };
    
    plugin.onInit(context);
  }
}
