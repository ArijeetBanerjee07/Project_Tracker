import React, { useState } from 'react';
import { formatPaise } from '../lib/money';
import { formatDisplayDate, getTodayIsoString } from '../lib/projects';
import type { AppSettings, ComputedProject } from '../types/project';
import { CustomDatePicker } from './CustomDatePicker';

interface ProjectDetailProps {
  project: ComputedProject;
  settings: AppSettings;
  onBack: () => void;
  onEdit: (project: ComputedProject) => void;
  onDelete: (id: string) => void;
  onToggleAdvance: (id: string, received: boolean, date?: string) => Promise<void>;
  onToggleBalance: (id: string, received: boolean, date?: string) => Promise<void>;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project,
  settings,
  onBack,
  onEdit,
  onDelete,
  onToggleAdvance,
  onToggleBalance,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currency = settings.currencySymbol;

  const handleAdvanceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const date = checked ? project.advanceReceivedDate || getTodayIsoString() : undefined;
    await onToggleAdvance(project.id, checked, date);
  };

  const handleBalanceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const date = checked ? project.balanceReceivedDate || getTodayIsoString() : undefined;
    await onToggleBalance(project.id, checked, date);
  };

  return (
    <div className="project-detail-container">
      {/* Navigation & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(project)}>
            Edit Project
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {project.title}
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {project.institute}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="status-indicator">
              <span className={`status-dot ${project.status}`} />
              <strong style={{ textTransform: 'capitalize' }}>
                {project.status.replace('_', ' ')}
              </strong>
            </span>
            {project.isOverdue && (
              <div style={{ marginTop: '4px' }}>
                <span className="badge-overdue">Past Deadline</span>
              </div>
            )}
          </div>
        </div>

        {project.description && (
          <p style={{ marginTop: '14px', fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
            {project.description}
          </p>
        )}

        <div className="divider" />

        {/* Dates Grid */}
        <div className="form-row form-row-2" style={{ fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Start Date: </span>
            <strong>{formatDisplayDate(project.startDate)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Tentative Deadline: </span>
            <strong>{formatDisplayDate(project.tentativeDeadline)}</strong>
          </div>
          {project.status === 'completed' && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Actual Completion Date: </span>
              <strong>{formatDisplayDate(project.actualCompletionDate) || '—'}</strong>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Assigned To: </span>
            <strong style={{ textTransform: 'capitalize' }}>
              {project.ownership === 'priya'
                ? 'Priya'
                : project.ownership === 'shared'
                ? `Shared (Arijeet: ${project.mySharePercent ?? 50}%, Priya: ${100 - (project.mySharePercent ?? 50)}%)`
                : 'Arijeet'}
            </strong>
          </div>
        </div>
      </div>

      {/* Payment Tracking & Status Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Payment Milestones & Status</span>
          <span className="tabular-nums" style={{ fontSize: '16px', fontWeight: 600 }}>
            Total: {formatPaise(project.totalAmount, { symbol: currency })}
          </span>
        </div>

        {/* Advance Milestone Card */}
        <div className="payment-toggle-card">
          <div className="payment-toggle-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                Advance Payment ({project.advancePercent}%)
              </div>
              <div className="stat-label" style={{ marginTop: '2px' }}>
                Amount: <strong className="tabular-nums">{formatPaise(project.overall.advanceAmount, { symbol: currency })}</strong>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={project.advanceReceived}
                onChange={handleAdvanceChange}
              />
              <span>{project.advanceReceived ? 'Received' : 'Mark as Received'}</span>
            </label>
          </div>

          {project.advanceReceived && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Received Date:</span>
              <div style={{ width: '160px' }}>
                <CustomDatePicker
                  value={project.advanceReceivedDate || ''}
                  onChange={(val) => {
                    onToggleAdvance(project.id, true, val || undefined);
                  }}
                  placeholder="Received Date"
                />
              </div>
            </div>
          )}
        </div>

        {/* Balance Milestone Card */}
        <div className="payment-toggle-card">
          <div className="payment-toggle-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>
                Balance Payment ({100 - project.advancePercent}%)
              </div>
              <div className="stat-label" style={{ marginTop: '2px' }}>
                Amount: <strong className="tabular-nums">{formatPaise(project.overall.balanceAmount, { symbol: currency })}</strong>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={project.balanceReceived}
                onChange={handleBalanceChange}
              />
              <span>{project.balanceReceived ? 'Received' : 'Mark as Received'}</span>
            </label>
          </div>

          {project.balanceReceived && (
            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Received Date:</span>
              <div style={{ width: '160px' }}>
                <CustomDatePicker
                  value={project.balanceReceivedDate || ''}
                  onChange={(val) => {
                    onToggleBalance(project.id, true, val || undefined);
                  }}
                  placeholder="Received Date"
                />
              </div>
            </div>
          )}
        </div>

        {/* Shared Breakdown (if shared project) */}
        {project.ownership === 'shared' && project.priyaShare && (
          <div style={{ marginTop: '16px' }}>
            <div className="stat-label" style={{ marginBottom: '8px' }}>
              Revenue Split Breakdown (Arijeet & Priya)
            </div>
            <div className="form-row form-row-2">
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                  Arijeet's Share ({project.mySharePercent ?? 50}%)
                </div>
                <div style={{ fontSize: '13px' }}>
                  Total: <strong className="tabular-nums">{formatPaise(project.arijeetShare.totalAmount, { symbol: currency })}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Advance: {formatPaise(project.arijeetShare.advanceAmount, { symbol: currency })} ({project.advanceReceived ? '✓' : '⏳'})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Balance: {formatPaise(project.arijeetShare.balanceAmount, { symbol: currency })} ({project.balanceReceived ? '✓' : '⏳'})
                </div>
              </div>

              <div
                className="shared-partner-card"
                style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius)' }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                  Priya's Share ({100 - (project.mySharePercent ?? 50)}%)
                </div>
                <div style={{ fontSize: '13px' }}>
                  Total: <strong className="tabular-nums">{formatPaise(project.priyaShare.totalAmount, { symbol: currency })}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Advance: {formatPaise(project.priyaShare.advanceAmount, { symbol: currency })} ({project.advanceReceived ? '✓' : '⏳'})
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Balance: {formatPaise(project.priyaShare.balanceAmount, { symbol: currency })} ({project.balanceReceived ? '✓' : '⏳'})
                </div>
              </div>
            </div>
          </div>
        )}

        {project.notes && (
          <div style={{ marginTop: '16px' }}>
            <div className="stat-label">Notes</div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', whiteSpace: 'pre-line' }}>
              {project.notes}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-title" style={{ color: 'var(--danger)' }}>
              Delete Project
            </div>
            <p style={{ fontSize: '14px', margin: '14px 0', color: 'var(--text-muted)' }}>
              Are you sure you want to delete <strong>"{project.title}"</strong>? This will remove all associated payment tracking permanently.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(project.id);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
