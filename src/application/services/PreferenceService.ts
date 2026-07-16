import { IEventBus } from '../../domain/events/IEventBus';
import { StorageAdapter } from '../../infrastructure/storage/StorageAdapter';
import { Preferences } from '../../shared/types';

export class PreferenceService {
  private static instance: PreferenceService;
  private preferences: Preferences;
  private readonly PREFS_KEY = 'draftly_preferences';

  private constructor(
    private storageAdapter: StorageAdapter,
    private eventBus: IEventBus
  ) {
    this.preferences = this.loadPreferences();
  }

  public static initialize(storageAdapter: StorageAdapter, eventBus: IEventBus): void {
    if (!PreferenceService.instance) {
      PreferenceService.instance = new PreferenceService(storageAdapter, eventBus);
    }
  }

  public static getInstance(): PreferenceService {
    if (!PreferenceService.instance) {
      throw new Error('PreferenceService must be initialized first.');
    }
    return PreferenceService.instance;
  }

  private loadPreferences(): Preferences {
    const defaultPrefs: Preferences = { font: 'fraunces', width: 'medium', theme: 'light' };
    const saved = this.storageAdapter.getItem<Preferences>(this.PREFS_KEY);
    return saved ? { ...defaultPrefs, ...saved } : defaultPrefs;
  }

  public getPreferences(): Preferences {
    return this.preferences;
  }

  public updatePreferences(updates: Partial<Preferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.storageAdapter.setItem(this.PREFS_KEY, this.preferences);
    this.eventBus.publish('PREFERENCES_UPDATED', { preferences: this.preferences });
  }
}
