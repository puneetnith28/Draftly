import { engine } from '../infrastructure/di/container';
import { DraftlyEngine } from '../application/facades/DraftlyEngine';

export function useDraftlyEngine(): DraftlyEngine {
  return engine;
}
