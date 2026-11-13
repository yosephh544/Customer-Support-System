import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { UserRole } from './types';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { RolePermissionsPage } from './pages/admin/RolePermissionsPage';

// Team Lead Pages
import { TeamOperationsPage } from './pages/teamLead/TeamOperationsPage';
import { ProjectsPage } from './pages/teamLead/ProjectsPage';
import { AssignmentsPage } from './pages/teamLead/AssignmentsPage';
import { SchedulePlannerPage } from './pages/teamLead/SchedulePlannerPage';

// Support Agent Pages
import { AgentWorkspacePage } from './pages/supportAgent/AgentWorkspacePage';
import { MyTouchpointsPage } from './pages/supportAgent/MyTouchpointsPage';

// Director Pages
import { ExecutiveInsightsPage } from './pages/director/ExecutiveInsightsPage';

import './App.css';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('active_tab');
    if (saved) return saved;
    if (role === UserRole.Admin) return 'admin-dashboard';
    if (role === UserRole.TeamLead) return 'team-operations';
    if (role === UserRole.SupportAgent) return 'agent-workspace';
    if (role === UserRole.Director) return 'executive-insights';
    return 'team-operations';
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('active_tab', tab);
  };

  // Sync active tab when role initializes or changes
  useEffect(() => {
    const saved = localStorage.getItem('active_tab');
    if (!saved && role !== null) {
      if (role === UserRole.Admin) {
        handleTabChange('admin-dashboard');
      } else if (role === UserRole.TeamLead) {
        handleTabChange('team-operations');
      } else if (role === UserRole.SupportAgent) {
        handleTabChange('agent-workspace');
      } else if (role === UserRole.Director) {
        handleTabChange('executive-insights');
      }
    }
  }, [role]);

  if (isLoading) {
    return (
      <div className="table-loading-container" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg" />
        <p className="loading-text">Loading DAF Support Workspace...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const getViewLabel = (): string => {
    switch (activeTab) {
      case 'admin-dashboard':
        return 'Admin Dashboard';
      case 'organizations':
      case 'organizations-view':
        return 'Customer Organizations';
      case 'users':
      case 'team-directory':
        return 'User & Team Directory';
      case 'permissions':
        return 'Security & Permissions Matrix';
      case 'team-operations':
      case 'team-workspace':
        return 'Operations Dashboard';
      case 'schedule-planner':
      case 'schedules-view':
        return 'Service Schedules & Delivery';
      case 'projects':
      case 'projects-view':
        return 'Projects & Modules';
      case 'assignments':
      case 'assignments-view':
        return 'Resource Allocation';
      case 'agent-workspace':
        return 'Specialist Dashboard';
      case 'agent-projects':
        return 'Assigned Projects';
      case 'my-touchpoints':
        return 'My Customer Touchpoints';
      case 'executive-insights':
        return 'Executive Insights Dashboard';
      default:
        return 'Workspace';
    }
  };

  const renderContent = () => {
    // Admin Role Views
    if (role === UserRole.Admin) {
      switch (activeTab) {
        case 'admin-dashboard':
          return (
            <AdminDashboard
              onNavigateToOrganizations={() => handleTabChange('organizations')}
              onNavigateToUsers={() => handleTabChange('users')}
            />
          );
        case 'organizations':
          return <OrganizationsPage />;
        case 'users':
          return <UsersPage />;
        case 'permissions':
          return <RolePermissionsPage />;
        default:
          return (
            <AdminDashboard
              onNavigateToOrganizations={() => handleTabChange('organizations')}
              onNavigateToUsers={() => handleTabChange('users')}
            />
          );
      }
    }

    // Team Lead Role Views
    if (role === UserRole.TeamLead) {
      switch (activeTab) {
        case 'team-operations':
        case 'team-workspace':
          return (
            <TeamOperationsPage
              onNavigateToAssignments={() => handleTabChange('assignments')}
              onNavigateToPlanner={() => handleTabChange('schedule-planner')}
            />
          );
        case 'projects':
          return <ProjectsPage />;
        case 'assignments':
          return <AssignmentsPage />;
        case 'schedule-planner':
          return <SchedulePlannerPage />;
        default:
          return (
            <TeamOperationsPage
              onNavigateToAssignments={() => handleTabChange('assignments')}
              onNavigateToPlanner={() => handleTabChange('schedule-planner')}
            />
          );
      }
    }

    // Support Agent Role Views
    if (role === UserRole.SupportAgent) {
      switch (activeTab) {
        case 'agent-workspace':
          return (
            <AgentWorkspacePage
              onNavigateToTouchpoints={() => handleTabChange('my-touchpoints')}
            />
          );
        case 'my-touchpoints':
          return <MyTouchpointsPage />;
        case 'agent-projects':
          return <ProjectsPage readOnly />;
        default:
          return (
            <AgentWorkspacePage
              onNavigateToTouchpoints={() => handleTabChange('my-touchpoints')}
            />
          );
      }
    }

    // Director Role Views
    if (role === UserRole.Director) {
      switch (activeTab) {
        case 'executive-insights':
          return (
            <ExecutiveInsightsPage
              onNavigateToOrganizations={() => handleTabChange('organizations-view')}
              onNavigateToProjects={() => handleTabChange('projects-view')}
              onNavigateToSchedules={() => handleTabChange('schedules-view')}
            />
          );
        case 'organizations-view':
        case 'organizations':
          return <OrganizationsPage readOnly />;
        case 'projects-view':
        case 'projects':
          return <ProjectsPage readOnly />;
        case 'schedules-view':
        case 'schedule-planner':
          return <SchedulePlannerPage readOnly />;
        case 'assignments-view':
        case 'assignments':
          return <AssignmentsPage readOnly />;
        case 'team-directory':
        case 'users':
          return <UsersPage readOnly />;
        default:
          return (
            <ExecutiveInsightsPage
              onNavigateToOrganizations={() => handleTabChange('organizations-view')}
              onNavigateToProjects={() => handleTabChange('projects-view')}
              onNavigateToSchedules={() => handleTabChange('schedules-view')}
            />
          );
      }
    }

    return <div>Select a navigation item from the sidebar.</div>;
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      currentViewLabel={getViewLabel()}
      onPlanWeek={role === UserRole.TeamLead ? () => handleTabChange('schedule-planner') : undefined}
      onReviewEscalations={role === UserRole.TeamLead ? () => handleTabChange('team-operations') : undefined}
    >
      {renderContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
