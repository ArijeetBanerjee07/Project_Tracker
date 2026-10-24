import React, { useState } from 'react';
import { paiseToRupees, rupeesToPaise } from '../lib/money';
import { getTodayIsoString } from '../lib/projects';
import type { AppSettings, Project, ProjectOwnership, ProjectStatus } from '../types/project';
import { CustomSelect, type SelectOption } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

interface ProjectFormProps {
  initialProject?: Project;
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const STATUS_OPTIONS: SelectOption<ProjectStatus>[] = [
  { value: 'in_progress', label: 'In Progress (Active)', dotClass: 'active' },
  { value: 'upcoming', label: 'Upcoming', dotClass: 'upcoming' },
  { value: 'completed', label: 'Completed', dotClass: 'completed' },
  { value: 'on_hold', label: 'On Hold', dotClass: 'on_hold' },
];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialProject,
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEdit = !!initialProject;

  const initialOwnership: ProjectOwnership =
    initialProject?.ownership === 'priya'
      ? 'priya'
      : initialProject?.ownership === 'shared'
      ? 'shared'
      : 'arijeet';

  const [title, setTitle] = useState(initialProject?.title ?? '');
  const [institute, setInstitute] = useState(initialProject?.institute ?? '');
  const [description, setDescription] = useState(initialProject?.description ?? '');
  const [ownership, setOwnership] = useState<ProjectOwnership>(initialOwnership);
  const [status, setStatus] = useState<ProjectStatus>(
    initialProject?.status ?? 'in_progress'
  );
  const [startDate, setStartDate] = useState(
    initialProject?.startDate ?? getTodayIsoString()
  );
  const [tentativeDeadline, setTentativeDeadline] = useState(
    initialProject?.tentativeDeadline ?? ''
  );
  const [actualCompletionDate, setActualCompletionDate] = useState(
    initialProject?.actualCompletionDate ?? ''
  );
  const [rupeesAmount, setRupeesAmount] = useState<string>(
    initialProject ? String(paiseToRupees(initialProject.totalAmount)) : ''
  );
  const [advancePercent, setAdvancePercent] = useState<number>(
    initialProject?.advancePercent ?? settings.defaultAdvancePercent ?? 50
  );
  const [mySharePercent, setMySharePercent] = useState<number>(
    initialProject?.mySharePercent ?? settings.defaultMySharePercent ?? 50
  );
  const [notes, setNotes] = useState(initialProject?.notes ?? '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!institute.trim()) newErrors.institute = 'Institute or client name is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!tentativeDeadline) newErrors.tentativeDeadline = 'Tentative deadline is required';

    if (startDate && tentativeDeadline && tentativeDeadline < startDate) {
      newErrors.tentativeDeadline = 'Deadline must be on or after the start date';
    }

    const paise = rupeesToPaise(rupeesAmount);
    if (!rupeesAmount || isNaN(paise) || paise <= 0) {
      newErrors.totalAmount = 'Total amount must be a positive number';
    }

    if (advancePercent < 0 || advancePercent > 100) {
      newErrors.advancePercent = 'Advance percent must be between 0 and 100';
    }

    if (ownership === 'shared') {
      if (mySharePercent < 0 || mySharePercent > 100) {
        newErrors.mySharePercent = "Arijeet's share percent must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const totalAmountPaise = rupeesToPaise(rupeesAmount);

      await onSave({
        title: title.trim(),
        institute: institute.trim(),
        description: description.trim() || undefined,
        ownership,
        status,
        startDate,
        tentativeDeadline,
        actualCompletionDate:
          status === 'completed'
            ? actualCompletionDate || getTodayIsoString()
            : undefined,
        totalAmount: totalAmountPaise,
        advancePercent,
        advanceReceived: initialProject?.advanceReceived ?? false,
        advanceReceivedDate: initialProject?.advanceReceivedDate,
        balanceReceived: initialProject?.balanceReceived ?? false,
        balanceReceivedDate: initialProject?.balanceReceivedDate,
        mySharePercent: ownership === 'shared' ? mySharePercent : undefined,
        notes: notes.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priyaSharePercent = 100 - mySharePercent;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-project-form">
        {/* Sticky Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEdit ? 'Edit Project' : 'New Project'}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Fill in project deliverables, split & milestone terms
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Scrollable Form Body with custom scrollbar */}
        <form id="project-form-element" onSubmit={handleSubmit} className="modal-body-scroll">
          {errors.form && (
            <div className="form-error" style={{ marginBottom: '12px' }}>
              {errors.form}
            </div>
          )}

          {/* Section 1: Overview */}
          <div className="form-section-title">1. Project Overview</div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Graphic Identity & Design System"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          {/* Institute / Client */}
          <div className="form-group">
            <label className="form-label">Institute / Client Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. National Design Institute"
              value={institute}
              onChange={(e) => setInstitute(e.target.value)}
            />
            {errors.institute && <div className="form-error">{errors.institute}</div>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Short Description (optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Brief scope, deliverables or contract reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Section 2: Ownership & Revenue Split */}
          <div className="form-section-title" style={{ marginTop: '18px' }}>
            2. Assignment & Revenue Split
          </div>

          <div className="form-group">
            <label className="form-label">Assigned To *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${ownership === 'arijeet' || ownership === 'arijit' || ownership === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 4px', fontSize: '13px' }}
                onClick={() => setOwnership('arijeet')}
              >
                Arijeet
              </button>
              <button
                type="button"
                className={`btn ${ownership === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 4px', fontSize: '13px' }}
                onClick={() => setOwnership('shared')}
              >
                Shared
              </button>
              <button
                type="button"
                className={`btn ${ownership === 'priya' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px 4px', fontSize: '13px' }}
                onClick={() => setOwnership('priya')}
              >
                Priya
              </button>
            </div>
          </div>

          {/* Shared Split configuration */}
          {ownership === 'shared' && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 14px',
                borderRadius: 'var(--radius)',
                marginBottom: '16px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500 }}>
                <span>Arijeet: <strong>{mySharePercent}%</strong></span>
                <span>Priya: <strong>{priyaSharePercent}%</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={mySharePercent}
                  onChange={(e) => setMySharePercent(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    style={{ width: '65px', padding: '4px 6px', textAlign: 'center' }}
                    value={mySharePercent}
                    onChange={(e) => setMySharePercent(Number(e.target.value))}
                  />
                  <span style={{ fontSize: '12px' }}>%</span>
                </div>
              </div>
              {errors.mySharePercent && (
                <div className="form-error">{errors.mySharePercent}</div>
              )}
            </div>
          )}

          {/* Section 3: Financials & Milestones */}
          <div className="form-section-title" style={{ marginTop: '18px' }}>
            3. Financials & Deadlines
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Total Amount ({settings.currencySymbol}) *</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input"
                placeholder="e.g. 50000"
                value={rupeesAmount}
                onChange={(e) => setRupeesAmount(e.target.value)}
              />
              {errors.totalAmount && (
                <div className="form-error">{errors.totalAmount}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Advance Percent (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(Number(e.target.value))}
              />
              <div className="form-hint">Default 50% advance / 50% balance</div>
              {errors.advancePercent && (
                <div className="form-error">{errors.advancePercent}</div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <CustomDatePicker
                value={startDate}
                onChange={(val) => setStartDate(val)}
                placeholder="Start Date"
                required
              />
              {errors.startDate && (
                <div className="form-error">{errors.startDate}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Tentative Deadline *</label>
              <CustomDatePicker
                value={tentativeDeadline}
                onChange={(val) => setTentativeDeadline(val)}
                placeholder="Tentative Deadline"
                required
              />
              {errors.tentativeDeadline && (
                <div className="form-error">{errors.tentativeDeadline}</div>
              )}
            </div>
          </div>

          {/* Custom Styled Status Dropdown */}
          <div className="form-group">
            <label className="form-label">Project Status</label>
            <CustomSelect
              value={status}
              options={STATUS_OPTIONS}
              onChange={(val) => setStatus(val)}
            />
          </div>

          {status === 'completed' && (
            <div className="form-group">
              <label className="form-label">Actual Completion Date</label>
              <CustomDatePicker
                value={actualCompletionDate}
                onChange={(val) => setActualCompletionDate(val)}
                placeholder="Actual Completion Date"
              />
            </div>
          )}

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Payment terms, contact person or milestones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>

        {/* Sticky Footer Action Bar */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form-element"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
