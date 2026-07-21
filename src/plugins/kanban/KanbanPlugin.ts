import { IDraftlyPlugin, PluginContext } from '../../lib/plugins/IDraftlyPlugin';
import { KanbanBlockEntity } from './KanbanBlockEntity';
import { KanbanComponent } from './KanbanComponent';

export class KanbanPlugin implements IDraftlyPlugin {
  public id = 'draftly-kanban-plugin';
  public name = 'Kanban Board Plugin';

  public onInit(context: PluginContext): void {
    // 1. Register the Domain Entity for data/storage layer
    context.registerBlockType(
      'kanban',
      (text: string) => KanbanBlockEntity.create(),
      (data: any) => new KanbanBlockEntity(data)
    );

    // 2. Register the React Component for the presentation layer
    context.registerBlockComponent('kanban', KanbanComponent);

    // 3. Register the block in the slash menu and floating toolbar
    context.registerSlashMenuItem('kanban', 'Kanban Board', '▤');
  }
}
