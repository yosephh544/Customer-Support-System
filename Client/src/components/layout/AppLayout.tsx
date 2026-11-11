import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppLayoutProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  currentViewLabel?: string;
  rightActions?: React.ReactNode;
  onPlanWeek?: () => void;
  onReviewEscalations?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  currentViewLabel,
  rightActions,
  onPlanWeek,
  onReviewEscalations,
  children,
}) => {
  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      <div className="app-main-content">
        <Header
          currentViewLabel={currentViewLabel}
          rightActions={rightActions}
          onPlanWeek={onPlanWeek}
          onReviewEscalations={onReviewEscalations}
        />
        <main className="content-container">{children}</main>
      </div>
    </div>
  );
};

