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
  const [activeTab, setActiveTab] = useState<string>('team-operations');

  // Set default active tab based on authenticated role
  useEffect(() => {
    if (role === UserRole.Admin) {
      setActiveTab('admin-dashboard');
    } else if (role === UserRole.TeamLead) {
      setActiveTab('team-operations');
    } else if (role === UserRole.SupportAgent) {
      setActiveTab('agent-workspace');
    } else if (role === UserRole.Director) {
      setActiveTab('executive-insights');
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
              onNavigateToOrganizations={() => setActiveTab('organizations')}
              onNavigateToUsers={() => setActiveTab('users')}
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
              onNavigateToOrganizations={() => setActiveTab('organizations')}
              onNavigateToUsers={() => setActiveTab('users')}
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
              onNavigateToAssignments={() => setActiveTab('assignments')}
              onNavigateToPlanner={() => setActiveTab('schedule-planner')}
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
              onNavigateToAssignments={() => setActiveTab('assignments')}
              onNavigateToPlanner={() => setActiveTab('schedule-planner')}
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
              onNavigateToTouchpoints={() => setActiveTab('my-touchpoints')}
            />
          );
        case 'my-touchpoints':
          return <MyTouchpointsPage />;
        case 'agent-projects':
          return <ProjectsPage readOnly />;
        default:
          return (
            <AgentWorkspacePage
              onNavigateToTouchpoints={() => setActiveTab('my-touchpoints')}
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
              onNavigateToOrganizations={() => setActiveTab('organizations-view')}
              onNavigateToProjects={() => setActiveTab('projects-view')}
              onNavigateToSchedules={() => setActiveTab('schedules-view')}
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
              onNavigateToOrganizations={() => setActiveTab('organizations-view')}
              onNavigateToProjects={() => setActiveTab('projects-view')}
              onNavigateToSchedules={() => setActiveTab('schedules-view')}
            />
          );
      }
    }

    return <div>Select a navigation item from the sidebar.</div>;
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      currentViewLabel={getViewLabel()}
      onPlanWeek={role === UserRole.TeamLead ? () => setActiveTab('schedule-planner') : undefined}
      onReviewEscalations={role === UserRole.TeamLead ? () => setActiveTab('team-operations') : undefined}
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
