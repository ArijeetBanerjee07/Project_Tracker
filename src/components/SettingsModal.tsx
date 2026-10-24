import React, { useRef, useState } from 'react';
import { getTodayIsoString } from '../lib/projects';
import type { AppSettings } from '../types/project';

import type { BackendHealth } from '../services';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  onExportJSON: () => Promise<string>;
  onImportJSON: (jsonString: string) => Promise<{ count: number }>;
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  backendHealth?: BackendHealth | null;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSaveSettings,
  onExportJSON,
  onImportJSON,
  theme,
  onSetTheme,
  backendHealth,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [defaultAdvancePercent, setDefaultAdvancePercent] = useState(
    settings.defaultAdvancePercent ?? 50
  );
  const [defaultMySharePercent, setDefaultMySharePercent] = useState(
    settings.defaultMySharePercent ?? 50
  );

  const [savedNotice, setSavedNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      currencySymbol,
      defaultAdvancePercent,
      defaultMySharePercent,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleExport = async () => {
    try {
      const jsonStr = await onExportJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_tracker_backup_${getTodayIsoString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setImportError('Export failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPendingFileContent(text);
        setShowImportConfirm(true);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read the selected backup file.');
    };
    reader.readAsText(file);

    // Reset input so the user can re-select the same file if needed
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingFileContent) return;
    setShowImportConfirm(false);

    try {
      setImportError(null);
      const res = await onImportJSON(pendingFileContent);
      setImportStatus(`Successfully restored ${res.count} projects from backup.`);
      setPendingFileContent(null);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import backup data.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">Settings & Backup</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body-scroll">
          {savedNotice && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                marginBottom: '14px',
              }}
            >
              ✓ Settings saved successfully.
            </div>
          )}

          {importStatus && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                marginBottom: '14px',
              }}
            >
              ✓ {importStatus}
            </div>
          )}

          {importError && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--danger-subtle)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                marginBottom: '14px',
              }}
            >
              ✕ {importError}
            </div>
          )}

          {/* Theme Switcher */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Theme Appearance</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSetTheme('light')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                Light Mode
              </button>
              <button
                type="button"
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => onSetTheme('dark')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                Dark Mode
              </button>
            </div>
          </div>

          <div className="divider" style={{ margin: '16px 0' }} />

          {/* Configuration Defaults */}
          <form id="settings-defaults-form" onSubmit={handleSaveDefaults}>
            <div className="form-group">
              <label className="form-label">Currency Symbol</label>
              <input
                type="text"
                className="form-input"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="e.g. ₹ or INR"
              />
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Default Advance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={defaultAdvancePercent}
                  onChange={(e) => setDefaultAdvancePercent(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default Shared Split (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="form-input"
                  value={defaultMySharePercent}
                  onChange={(e) => setDefaultMySharePercent(Number(e.target.value))}
                />
                <div className="form-hint">Arijeet's share percentage</div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              style={{ marginBottom: '16px' }}
            >
              Save Defaults
            </button>
          </form>

          <div className="divider" style={{ margin: '16px 0' }} />

          {/* Database & Multi-User Sync (Arijeet & Priya) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                Shared Database & Multi-User Sync
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: backendHealth?.db.connected
                    ? 'rgba(47, 93, 80, 0.15)'
                    : 'rgba(230, 162, 60, 0.15)',
                  color: backendHealth?.db.connected ? 'var(--accent)' : '#E6A23C',
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: backendHealth?.db.connected ? 'var(--accent)' : '#E6A23C',
                  }}
                />
                {backendHealth?.db.connected
                  ? 'PostgreSQL Connected'
                  : 'Live Server Sync Active'}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
              {backendHealth?.db.connected ? (
                <>
                  Projects and payment milestones are stored centrally in <strong>PostgreSQL</strong>.
                  Any changes made by you or Priya update automatically for both of you in real-time.
                </>
              ) : (
                <>
                  Live backend API is synchronizing projects for both <strong>Arijeet &amp; Priya</strong>.
                  To connect your persistent database, configure <code style={{ fontSize: '12px', padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: '4px' }}>DATABASE_URL</code> in <code style={{ fontSize: '12px', padding: '1px 4px', background: 'var(--bg-subtle)', borderRadius: '4px' }}>.env</code>.
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExport}>
                ↓ Export JSON Backup
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                ↑ Import JSON Backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          {onLogout ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              Sign Out
            </button>
          ) : <div />}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Import Confirmation Dialog */}
        {showImportConfirm && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <div className="modal-title" style={{ color: 'var(--danger)' }}>
                Overwrite Current Data?
              </div>
              <p style={{ fontSize: '13px', margin: '14px 0', color: 'var(--text-muted)' }}>
                Restoring this JSON backup will <strong>replace all projects</strong> currently on this device.
                Make sure you have exported a copy if you wish to keep your current records.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowImportConfirm(false);
                    setPendingFileContent(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmImport}
                >
                  Yes, Overwrite & Import
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
