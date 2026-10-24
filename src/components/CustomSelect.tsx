import React, { useEffect, useRef, useState } from 'react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  dotClass?: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
}

export function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div className="custom-select-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">
          {selectedOption ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {selectedOption.dotClass && (
                <span className={`status-dot ${selectedOption.dotClass}`} />
              )}
              {selectedOption.label}
            </span>
          ) : (
            <span style={{ color: 'var(--text-subtle)' }}>{placeholder}</span>
          )}
        </span>

        {/* Minimal chevron icon */}
        <svg
          className={`custom-select-chevron ${isOpen ? 'rotated' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
                role="option"
                aria-selected={isSelected}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {opt.dotClass && <span className={`status-dot ${opt.dotClass}`} />}
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <span style={{ color: 'var(--accent)', fontSize: '12px' }}>✓</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
