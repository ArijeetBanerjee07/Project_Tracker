import React, { useMemo, useState } from 'react';
import { formatPaise } from '../lib/money';
import { computeSharedSummary, formatDisplayDate } from '../lib/projects';
import type { AppSettings, ComputedProject, ProjectStatus } from '../types/project';

interface SharedListProps {
  projects: ComputedProject[];
  settings: AppSettings;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
}

export const SharedList: React.FC<SharedListProps> = ({
  projects,
  settings,
  onSelectProject,
  onOpenNewProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const currency = settings.currencySymbol;

  // Filter only 'shared' projects
  const sharedProjects = useMemo(() => {
    return projects.filter((p) => p.ownership === 'shared');
  }, [projects]);

  // Aggregate totals specifically for shared projects using computeSharedSummary
  const summary = useMemo(() => {
    return computeSharedSummary(projects);
  }, [projects]);

  // Filter by status & search query (title or institute)
  const filtered = useMemo(() => {
    return sharedProjects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesInstitute = p.institute.toLowerCase().includes(q);
        if (!matchesTitle && !matchesInstitute) return false;
      }
      return true;
    });
  }, [sharedProjects, statusFilter, search]);

  const receivedPercent =
    summary.overallMoney.total > 0
      ? Math.round((summary.overallMoney.received / summary.overallMoney.total) * 100)
      : 0;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">Shared Projects</h1>
          <div className="screen-subtitle">
            Joint assignments split between Arijeet & Priya ({sharedProjects.length} projects)
          </div>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewProject}>
          + New Project
        </button>
      </div>

      {/* Visually Separated Shared Totals: Strict Isolation */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Shared Revenue Division</span>
          <span className="stat-label">
            Total Value: <strong className="tabular-nums">{formatPaise(summary.overallMoney.total, { symbol: currency })}</strong> ({receivedPercent}% received)
          </span>
        </div>

        <div className="form-row form-row-2">
          {/* Arijeet's Shared Earnings */}
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
              Arijeet's Share (from Shared)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Total Assigned:</span>
              <strong className="tabular-nums">{formatPaise(summary.arijeetMoney.total, { symbol: currency })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Received:</span>
              <span className="tabular-nums" style={{ color: 'var(--accent)' }}>
                {formatPaise(summary.arijeetMoney.received, { symbol: currency })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Pending Advance:</span>
              <span className="tabular-nums">{formatPaise(summary.arijeetMoney.pendingAdvance, { symbol: currency })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="stat-label">Pending Balance:</span>
              <span className="tabular-nums">{formatPaise(summary.arijeetMoney.pendingBalance, { symbol: currency })}</span>
            </div>
          </div>

          {/* Priya's Earnings: Visually Distinct Box */}
          <div
            className="shared-partner-card"
            style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius)' }}
          >
            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>
              Priya's Share (from Shared)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Total Assigned:</span>
              <strong className="tabular-nums">{formatPaise(summary.priyaMoney.total, { symbol: currency })}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Received:</span>
              <span className="tabular-nums" style={{ color: 'var(--accent)' }}>
                {formatPaise(summary.priyaMoney.received, { symbol: currency })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="stat-label">Pending Advance:</span>
              <span className="tabular-nums">{formatPaise(summary.priyaMoney.pendingAdvance, { symbol: currency })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="stat-label">Pending Balance:</span>
              <span className="tabular-nums">{formatPaise(summary.priyaMoney.pendingBalance, { symbol: currency })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-input-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search shared projects by title or institute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="status-pills">
          {(['all', 'in_progress', 'upcoming', 'completed', 'on_hold'] as const).map(
            (status) => (
              <button
                key={status}
                className={`status-pill ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all'
                  ? 'All'
                  : status === 'in_progress'
                  ? 'In Progress'
                  : status === 'on_hold'
                  ? 'On Hold'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Shared Project List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="empty-title">No shared projects found</div>
          <div className="empty-subtitle">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : 'Add a project with "Shared" ownership to track joint assignments.'}
          </div>
          <button className="btn btn-primary" onClick={onOpenNewProject}>
            + Create Shared Project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {filtered.map((proj) => {
            const arijeetPct = proj.mySharePercent ?? 50;
            const priyaPct = 100 - arijeetPct;

            return (
              <div
                key={proj.id}
                className="project-item"
                onClick={() => onSelectProject(proj.id)}
              >
                <div className="project-item-top">
                  <div>
                    <div className="project-item-title">{proj.title}</div>
                    <div className="project-item-institute">{proj.institute}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular-nums" style={{ fontWeight: 600 }}>
                      Total: {formatPaise(proj.totalAmount, { symbol: currency })}
                    </div>
                    {proj.isOverdue ? (
                      <span className="badge-overdue">Overdue</span>
                    ) : (
                      <span className="status-indicator">
                        <span className={`status-dot ${proj.status}`} />
                        {proj.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Split Details Breakdown Card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    margin: '10px 0',
                    fontSize: '12px',
                  }}
                >
                  {/* Arijeet's Share */}
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
                      Arijeet ({arijeetPct}%)
                    </div>
                    <div className="tabular-nums" style={{ fontWeight: 600, fontSize: '13px' }}>
                      {formatPaise(proj.arijeetShare.totalAmount, { symbol: currency })}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                      Adv: {proj.advanceReceived ? '✓ Recv' : '⏳ Pend'} | Bal:{' '}
                      {proj.balanceReceived ? '✓ Recv' : '⏳ Pend'}
                    </div>
                  </div>

                  {/* Priya's Share */}
                  <div
                    className="shared-partner-card"
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>
                      Priya ({priyaPct}%)
                    </div>
                    <div className="tabular-nums" style={{ fontWeight: 600, fontSize: '13px' }}>
                      {proj.priyaShare
                        ? formatPaise(proj.priyaShare.totalAmount, { symbol: currency })
                        : '—'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '3px' }}>
                      Adv: {proj.advanceReceived ? '✓ Recv' : '⏳ Pend'} | Bal:{' '}
                      {proj.balanceReceived ? '✓ Recv' : '⏳ Pend'}
                    </div>
                  </div>
                </div>

                <div className="project-item-bottom">
                  <span>
                    Deadline: <strong>{formatDisplayDate(proj.tentativeDeadline)}</strong>
                  </span>
                  <span>Split: <strong>Arijeet {arijeetPct}% / Priya {priyaPct}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
