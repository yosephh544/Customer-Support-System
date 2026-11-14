import React from 'react';
import { SearchIcon, CloseIcon } from '../icons/Icons';

export interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  children?: React.ReactNode;
  actionButton?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  filters,
  children,
  actionButton,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar-inputs">
        <div className="search-input-wrapper">
          <SearchIcon size={16} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="filter-search-input"
            aria-label="Filter search"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <CloseIcon size={13} />
            </button>
          )}
        </div>

        {filters}
        {children}

        {hasActiveFilters && onClearFilters && (
          <button
            type="button"
            className="btn-clear-filters"
            onClick={onClearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {actionButton && <div className="filter-bar-action">{actionButton}</div>}
    </div>
  );
};

