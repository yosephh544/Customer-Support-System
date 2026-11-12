import React from 'react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  emptyTitle?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  emptySecondaryAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No records found matching your filters.',
  emptyTitle,
  emptyIcon,
  emptyAction,
  emptySecondaryAction,
  onRowClick,
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="table-loading-container">
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty-container">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle || 'No records found'}
          description={emptyMessage}
          action={emptyAction}
          secondaryAction={emptySecondaryAction}
        />
      </div>
    );
  }

  return (
    <div className={`table-responsive ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'clickable-row' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align || 'left' }}
                >
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
