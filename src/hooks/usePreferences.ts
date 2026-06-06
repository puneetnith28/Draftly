'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserPreferences {
  theme: 'light' | 'dark';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  pageMargins: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 16,
  lineHeight: 1.6,
  pageMargins: 40,
};

const STORAGE_KEY = 'draftly_preferences';

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load user preferences', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    root.style.setProperty('--editor-font-family', preferences.fontFamily);
    root.style.setProperty('--editor-font-size', `${preferences.fontSize}px`);
    root.style.setProperty('--editor-line-height', String(preferences.lineHeight));
    root.style.setProperty('--editor-page-margin', `${preferences.pageMargins}px`);
  }, [preferences]);

  return {
    preferences,
    updatePreference,
  };
}
