import React from 'react';
import { Badge } from '../../components/common/Badge';
import { CheckIcon, CloseIcon, ShieldIcon } from '../../components/icons/Icons';

export const RolePermissionsPage: React.FC = () => {
  const matrixData = [
    {
      category: 'User Management',
      permissions: [
        { name: 'View Users', id: 'Users.View', admin: true, teamLead: true, director: true, agent: false },
        { name: 'Create & Edit Users', id: 'Users.Create / Edit', admin: true, teamLead: false, director: false, agent: false },
        { name: 'Delete / Deactivate Users', id: 'Users.Delete', admin: true, teamLead: false, director: false, agent: false },
        { name: 'Manage User Roles', id: 'Users.ManageRoles', admin: true, teamLead: false, director: false, agent: false },
      ],
    },
    {
      category: 'Organizations',
      permissions: [
        { name: 'View Organizations', id: 'Organizations.View', admin: true, teamLead: true, director: true, agent: true },
        { name: 'Create Customer Organizations', id: 'Organizations.Create', admin: true, teamLead: false, director: false, agent: false },
        { name: 'Edit & Delete Organizations', id: 'Organizations.Edit / Delete', admin: true, teamLead: false, director: false, agent: false },
      ],
    },
    {
      category: 'Projects & Modules',
      permissions: [
        { name: 'View Projects & Modules', id: 'Projects.View / Modules.View', admin: false, teamLead: true, director: true, agent: true },
        { name: 'Create & Edit Projects', id: 'Projects.Create / Edit', admin: false, teamLead: true, director: false, agent: false },
        { name: 'Assign Modules to Projects', id: 'Modules.Create / Edit', admin: false, teamLead: true, director: false, agent: false },
        { name: 'Archive / Delete Projects', id: 'Projects.Delete', admin: false, teamLead: true, director: false, agent: false },
      ],
    },
    {
      category: 'Assignments & Scheduling',
      permissions: [
        { name: 'View Team Assignments', id: 'Assignments.View', admin: false, teamLead: true, director: true, agent: true },
        { name: 'Assign Agents to Projects/Modules', id: 'Assignments.Manage', admin: false, teamLead: true, director: false, agent: false },
        { name: 'Create & Plan Weekly Schedules', id: 'Schedules.Create / Assign', admin: false, teamLead: true, director: false, agent: false },
        { name: 'Execute Touchpoints (Conduct & Complete)', id: 'Schedules.Execute', admin: false, teamLead: true, director: false, agent: true },
      ],
    },
    {
      category: 'Feedback & Executive Insights',
      permissions: [
        { name: 'View Feedback & CSAT Ratings', id: 'Feedbacks.View', admin: false, teamLead: true, director: true, agent: true },
        { name: 'Record Touchpoint Feedback', id: 'Feedbacks.Create / Edit', admin: false, teamLead: true, director: false, agent: true },
        { name: 'Export Executive & Audit Reports', id: 'Reports.Export', admin: false, teamLead: false, director: true, agent: false },
      ],
    },
  ];

  return (
    <div className="role-permissions-page">
      <div className="page-header-row mb-3 flex items-center justify-between">
        <div>
          <h2 className="main-page-title">Role Permission Matrix</h2>
          <p className="main-page-subtitle">
            System policy defining operational boundaries per role.
          </p>
        </div>
        <div className="security-policy-pill">
          <ShieldIcon size={14} />
          <span>Role-Based Access Policy</span>
        </div>
      </div>

      <div className="content-card overflow-hidden">
        <div className="table-responsive">
          <table className="matrix-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>CAPABILITY / PERMISSION</th>
                <th style={{ textAlign: 'center' }}>
                  <Badge variant="danger" size="sm">ADMIN</Badge>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <Badge variant="primary" size="sm">TEAM LEAD</Badge>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <Badge variant="success" size="sm">SUPPORT AGENT</Badge>
                </th>
                <th style={{ textAlign: 'center' }}>
                  <Badge variant="purple" size="sm">DIRECTOR</Badge>
                </th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((section) => (
                <React.Fragment key={section.category}>
                  <tr className="matrix-category-row">
                    <td colSpan={5} className="font-bold text-dark text-xs uppercase tracking-wider">
                      {section.category}
                    </td>
                  </tr>
                  {section.permissions.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium text-dark text-sm">{p.name}</div>
                        <div className="text-xs text-muted">{p.id}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.admin ? (
                          <span className="matrix-check"><CheckIcon size={16} /></span>
                        ) : (
                          <span className="matrix-cross"><CloseIcon size={14} /></span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.teamLead ? (
                          <span className="matrix-check"><CheckIcon size={16} /></span>
                        ) : (
                          <span className="matrix-cross"><CloseIcon size={14} /></span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.agent ? (
                          <span className="matrix-check"><CheckIcon size={16} /></span>
                        ) : (
                          <span className="matrix-cross"><CloseIcon size={14} /></span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.director ? (
                          <span className="matrix-check"><CheckIcon size={16} /></span>
                        ) : (
                          <span className="matrix-cross"><CloseIcon size={14} /></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
