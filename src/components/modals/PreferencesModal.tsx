'use client';

import React from 'react';
import { UserPreferences } from '@/hooks/usePreferences';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
}

const FONTS = [
  { name: 'Sans Serif', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { name: 'Classic Serif', value: 'Lora, Georgia, Cambria, serif' },
  { name: 'Pro Mono', value: 'Fira Code, Courier New, monospace' },
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  updatePreference,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editor Preferences</h3>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="preference-group">
            <label>Theme</label>
            <div className="theme-toggle-group">
              <button
                className={`theme-btn ${preferences.theme === 'light' ? 'active' : ''}`}
                onClick={() => updatePreference('theme', 'light')}
              >
                ☀️ Light
              </button>
              <button
                className={`theme-btn ${preferences.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updatePreference('theme', 'dark')}
              >
                🌙 Dark
              </button>
            </div>
          </div>

          <div className="preference-group">
            <label>Font Family</label>
            <select
              value={preferences.fontFamily}
              onChange={(e) => updatePreference('fontFamily', e.target.value)}
              className="preference-select"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="preference-group">
            <div className="preference-label-row">
              <label>Font Size</label>
              <span>{preferences.fontSize}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="24"
              value={preferences.fontSize}
              onChange={(e) => updatePreference('fontSize', parseInt(e.target.value))}
              className="preference-slider"
            />
          </div>

          <div className="preference-group">
            <div className="preference-label-row">
              <label>Line Height</label>
              <span>{preferences.lineHeight}</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="2.0"
              step="0.1"
              value={preferences.lineHeight}
              onChange={(e) => updatePreference('lineHeight', parseFloat(e.target.value))}
              className="preference-slider"
            />
          </div>

          <div className="preference-group">
            <div className="preference-label-row">
              <label>Page Margins</label>
              <span>{preferences.pageMargins}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={preferences.pageMargins}
              onChange={(e) => updatePreference('pageMargins', parseInt(e.target.value))}
              className="preference-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
