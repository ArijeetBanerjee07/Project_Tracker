import React, { useEffect, useMemo, useRef, useState } from 'react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseIsoDate(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function formatIso(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '';
  const monthShort = MONTH_NAMES[parsed.month]?.substring(0, 3);
  return `${parsed.day} ${monthShort} ${parsed.year}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedVal = useMemo(() => parseIsoDate(value), [value]);

  // Current calendar view (year and month)
  const today = useMemo(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      iso: formatIso(d.getFullYear(), d.getMonth(), d.getDate()),
    };
  }, []);

  const [viewYear, setViewYear] = useState<number>(() => parsedVal?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState<number>(() => parsedVal?.month ?? today.month);

  // Sync view when opened or when value changes
  useEffect(() => {
    if (parsedVal) {
      setViewYear(parsedVal.year);
      setViewMonth(parsedVal.month);
    }
  }, [value]);

  // Handle outside click & auto scroll into view
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (iso: string) => {
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(today.iso);
    setViewYear(today.year);
    setViewMonth(today.month);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate days matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      iso: string;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Prev month overflow days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = formatIso(prevY, prevM, d);
      days.push({
        day: d,
        isCurrentMonth: false,
        iso,
        isSelected: iso === value,
        isToday: iso === today.iso,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = formatIso(viewYear, viewMonth, d);
      days.push({
        day: d,
        isCurrentMonth: true,
        iso,
        isSelected: iso === value,
        isToday: iso === today.iso,
      });
    }

    // Next month overflow days to keep a clean 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = formatIso(nextY, nextM, d);
      days.push({
        day: d,
        isCurrentMonth: false,
        iso,
        isSelected: iso === value,
        isToday: iso === today.iso,
      });
    }

    return days;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek, daysInPrevMonth, value, today.iso]);

  return (
    <div className="custom-datepicker-wrapper" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-datepicker-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={`custom-datepicker-display ${!value ? 'placeholder' : ''}`}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>

        {/* Minimal calendar icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && !required && (
            <span
              className="datepicker-clear-btn"
              onClick={handleClear}
              title="Clear date"
              aria-label="Clear date"
            >
              ✕
            </span>
          )}
          <svg
            className="custom-datepicker-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </button>

      {/* Calendar Popup Dropdown */}
      {isOpen && (
        <div className="custom-calendar-popup" role="dialog" aria-label="Calendar">
          {/* Header Month / Year & Prev / Next */}
          <div className="calendar-header">
            <div className="calendar-title">
              <span className="calendar-month-name">{MONTH_NAMES[viewMonth]}</span>
              <span className="calendar-year-name">{viewYear}</span>
            </div>

            <div className="calendar-nav-buttons">
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handlePrevMonth}
                title="Previous month"
                aria-label="Previous month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                className="calendar-nav-btn"
                onClick={handleNextMonth}
                title="Next month"
                aria-label="Next month"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="calendar-weekdays">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name} className="calendar-weekday">
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid">
            {calendarDays.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                className={`calendar-day-btn ${!cell.isCurrentMonth ? 'overflow' : ''} ${
                  cell.isSelected ? 'selected' : ''
                } ${cell.isToday ? 'today' : ''}`}
                onClick={() => handleSelectDay(cell.iso)}
              >
                <span>{cell.day}</span>
                {cell.isToday && !cell.isSelected && <span className="today-dot" />}
              </button>
            ))}
          </div>

          {/* Footer Shortcuts */}
          <div className="calendar-footer">
            <button
              type="button"
              className="calendar-footer-btn"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="calendar-footer-btn today-btn"
              onClick={handleSelectToday}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
