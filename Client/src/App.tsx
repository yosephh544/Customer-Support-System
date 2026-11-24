import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { UserRole } from './types';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrganizationsPage } from './pages/admin/OrganizationsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { RolePermissionsPage } from './pages/admin/RolePermissionsPage';
import { ConfigurationPage } from './pages/admin/ConfigurationPage';

// Team Lead Pages
import { TeamOperationsPage } from './pages/teamLead/TeamOperationsPage';
import { ProjectsPage } from './pages/teamLead/ProjectsPage';
import { AssignmentsPage } from './pages/teamLead/AssignmentsPage';
import { SchedulePlannerPage } from './pages/teamLead/SchedulePlannerPage';
import { TeamLeadReportsPage } from './pages/teamLead/TeamLeadReportsPage';

// Support Agent Pages
import { AgentWorkspacePage } from './pages/supportAgent/AgentWorkspacePage';
import { MyTouchpointsPage } from './pages/supportAgent/MyTouchpointsPage';
import { TicketDeskPage } from './pages/supportAgent/TicketDeskPage';

// Director Pages
import { ExecutiveInsightsPage } from './pages/director/ExecutiveInsightsPage';
import { DirectorReportsPage, type DirectorReportTab } from './pages/director/DirectorReportsPage';
import { CommercialPipelinePage } from './pages/commercial/CommercialPipelinePage';

// Client Portal Pages
import { ClientPortalDashboard } from './pages/portal/ClientPortalDashboard';
import { ClientTicketsPage } from './pages/portal/ClientTicketsPage';
import { ClientServiceHubPage } from './pages/portal/ClientServiceHubPage';

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
    if (role === UserRole.ClientPortalUser) return 'portal-dashboard';
    return 'team-operations';
  });
  const [directorReportTab, setDirectorReportTab] = useState<DirectorReportTab>('sla-velocity');

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
      } else if (role === UserRole.ClientPortalUser) {
        handleTabChange('portal-dashboard');
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
      case 'configuration':
        return 'System Configuration';
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
        return 'Assigned Tasks';
      case 'my-touchpoints':
        return 'My Customer Touchpoints';
      case 'executive-insights':
        return 'Executive Insights Dashboard';
      case 'director-reports':
        return 'Executive Governance & Performance Reports';
      case 'teamlead-reports':
        return 'Team Operations & Execution Issue Reports';
      case 'customer-feedback':
        return 'Customer Feedback & Stakeholder Intelligence';
      case 'ticket-desk':
        return 'Reactive Support Desk & SLA';
      case 'commercial-pipeline':
        return 'Commercial Acquisition & Opportunities';
      case 'portal-dashboard':
        return 'Customer Support Portal';
      case 'portal-tickets':
        return 'My Support Tickets';
      case 'portal-services':
        return 'Agreements & Service Expansion';
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
        case 'configuration':
          return <ConfigurationPage />;
        case 'ticket-desk':
          return <TicketDeskPage />;
        case 'commercial-pipeline':
          return <CommercialPipelinePage />;
        case 'commercial-pipeline':
          return <CommercialPipelinePage />;
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
        case 'teamlead-reports':
          return <TeamLeadReportsPage />;
        case 'ticket-desk':
          return <TicketDeskPage />;
        case 'commercial-pipeline':
          return <CommercialPipelinePage />;
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
        case 'ticket-desk':
          return <TicketDeskPage />;
        case 'commercial-pipeline':
          return <CommercialPipelinePage />;
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
              onNavigateToFeedback={() => {
                setDirectorReportTab('customer-feedback');
                handleTabChange('director-reports');
              }}
              onNavigateToProjects={() => {
                setDirectorReportTab('projects-delivery');
                handleTabChange('director-reports');
              }}
              onNavigateToOrganizations={() => {
                setDirectorReportTab('customer-tenants');
                handleTabChange('director-reports');
              }}
              onNavigateToSchedules={() => handleTabChange('schedules-view')}
              onNavigateToAssignments={() => handleTabChange('assignments-view')}
              onNavigateToUsers={() => handleTabChange('team-directory')}
            />
          );
        case 'director-reports':
          return (
            <DirectorReportsPage
              initialTab={directorReportTab}
              onTabChange={(tab) => setDirectorReportTab(tab)}
            />
          );
        case 'ticket-desk':
          return <TicketDeskPage />;
        case 'commercial-pipeline':
          return <CommercialPipelinePage />;
        case 'customer-feedback':
          return (
            <DirectorReportsPage
              initialTab="customer-feedback"
              onTabChange={(tab) => setDirectorReportTab(tab)}
            />
          );
        case 'organizations-view':
        case 'organizations':
          return (
            <DirectorReportsPage
              initialTab="customer-tenants"
              onTabChange={(tab) => setDirectorReportTab(tab)}
            />
          );
        case 'projects-view':
        case 'projects':
          return (
            <DirectorReportsPage
              initialTab="projects-delivery"
              onTabChange={(tab) => setDirectorReportTab(tab)}
            />
          );
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
              onNavigateToFeedback={() => {
                setDirectorReportTab('customer-feedback');
                handleTabChange('director-reports');
              }}
              onNavigateToProjects={() => {
                setDirectorReportTab('projects-delivery');
                handleTabChange('director-reports');
              }}
              onNavigateToOrganizations={() => {
                setDirectorReportTab('customer-tenants');
                handleTabChange('director-reports');
              }}
              onNavigateToSchedules={() => handleTabChange('schedules-view')}
              onNavigateToAssignments={() => handleTabChange('assignments-view')}
              onNavigateToUsers={() => handleTabChange('team-directory')}
            />
          );
      }
    }

    // Client Portal Representative Views
    if (role === UserRole.ClientPortalUser) {
      switch (activeTab) {
        case 'portal-dashboard':
          return (
            <ClientPortalDashboard
              onNavigateToTickets={() => handleTabChange('portal-tickets')}
              onNavigateToServices={() => handleTabChange('portal-services')}
            />
          );
        case 'portal-tickets':
          return <ClientTicketsPage />;
        case 'portal-services':
          return <ClientServiceHubPage />;
        default:
          return (
            <ClientPortalDashboard
              onNavigateToTickets={() => handleTabChange('portal-tickets')}
              onNavigateToServices={() => handleTabChange('portal-services')}
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
