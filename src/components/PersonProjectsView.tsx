import React, { useMemo, useState } from 'react';
import { formatPaise } from '../lib/money';
import { computePersonSummary, formatDisplayDate } from '../lib/projects';
import type { AppSettings, ComputedProject, ProjectStatus } from '../types/project';

interface PersonProjectsViewProps {
  person: 'arijeet' | 'arijit' | 'priya';
  displayName: string;
  projects: ComputedProject[];
  settings: AppSettings;
  onSelectProject: (id: string) => void;
  onOpenNewProject: () => void;
}

export const PersonProjectsView: React.FC<PersonProjectsViewProps> = ({
  person,
  displayName,
  projects,
  settings,
  onSelectProject,
  onOpenNewProject,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const currency = settings.currencySymbol;

  const isArijeet = person === 'arijeet' || person === 'arijit';

  // Filter projects relevant to this person (individual projects + shared projects)
  const relevantProjects = useMemo(() => {
    return projects.filter((p) => {
      if (isArijeet) {
        return (
          p.ownership === 'arijeet' ||
          p.ownership === 'arijit' ||
          p.ownership === 'mine' ||
          p.ownership === 'shared'
        );
      } else {
        return p.ownership === 'priya' || p.ownership === 'shared';
      }
    });
  }, [projects, isArijeet]);

  // Compute summary metrics for this person
  const summary = useMemo(() => {
    return computePersonSummary(projects, person);
  }, [projects, person]);

  // Filtered by status and search query
  const filtered = useMemo(() => {
    return relevantProjects.filter((p) => {
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
  }, [relevantProjects, statusFilter, search]);

  const receivedPercent =
    summary.money.total > 0
      ? Math.round((summary.money.received / summary.money.total) * 100)
      : 0;

  return (
    <div className="screen-container">
      <div className="screen-header">
        <div>
          <h1 className="screen-title">{displayName}</h1>
          <div className="screen-subtitle">
            {summary.counts.total} assignments ({summary.counts.active} active, {summary.counts.upcoming} upcoming)
          </div>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewProject}>
          + New Project
        </button>
      </div>

      {/* Financial Overview Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{displayName}'s Financial Summary</span>
          <span className="stat-label">{receivedPercent}% Received</span>
        </div>

        <div className="stat-grid stat-grid-3">
          <div className="stat-box">
            <div className="stat-label">Total Assigned</div>
            <div className="stat-val tabular-nums">
              {formatPaise(summary.money.total, { symbol: currency })}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Received So Far</div>
            <div className="stat-val tabular-nums" style={{ color: 'var(--accent)' }}>
              {formatPaise(summary.money.received, { symbol: currency })}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Total Pending</div>
            <div className="stat-val tabular-nums">
              {formatPaise(summary.money.pendingTotal, { symbol: currency })}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.min(100, receivedPercent)}%` }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Pending Advance: </span>
            <strong className="tabular-nums">
              {formatPaise(summary.money.pendingAdvance, { symbol: currency })}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Pending Balance: </span>
            <strong className="tabular-nums">
              {formatPaise(summary.money.pendingBalance, { symbol: currency })}
            </strong>
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
            placeholder="Search by title or institute..."
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

      {/* Project List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="empty-title">No projects found for {displayName}</div>
          <div className="empty-subtitle">
            {search || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : `Create an assignment for ${displayName} to start tracking payments.`}
          </div>
          <button className="btn btn-primary" onClick={onOpenNewProject}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="project-list">
          {filtered.map((proj) => {
            const isShared = proj.ownership === 'shared';
            const personShare = isArijeet ? proj.arijeetShare : proj.priyaShare;
            const shareAmount = personShare?.totalAmount ?? 0;

            return (
              <div
                key={proj.id}
                className="project-item"
                onClick={() => onSelectProject(proj.id)}
              >
                <div className="project-item-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="project-item-title">{proj.title}</span>
                      {isShared && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '1px 6px',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Shared ({isArijeet ? proj.mySharePercent ?? 50 : 100 - (proj.mySharePercent ?? 50)}%)
                        </span>
                      )}
                    </div>
                    <div className="project-item-institute">{proj.institute}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular-nums" style={{ fontWeight: 600 }}>
                      {formatPaise(shareAmount, { symbol: currency })}
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

                <div className="project-item-bottom">
                  <span>
                    Deadline: <strong>{formatDisplayDate(proj.tentativeDeadline)}</strong>
                  </span>

                  <div className="project-item-payments">
                    <span
                      style={{
                        color: proj.advanceReceived ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Adv: {proj.advanceReceived ? '✓ Recv' : '⏳ Pend'}
                    </span>
                    <span
                      style={{
                        color: proj.balanceReceived ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      Bal: {proj.balanceReceived ? '✓ Recv' : '⏳ Pend'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
