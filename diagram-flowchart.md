# Diagram 1 — Implementation & Request Flow

## High-Level Request Pipeline

```text
        ┌──────────────────────────────────────────────────────────────┐
        │                    CLIENT (React/Vite)                        │
        │  POST /api/auth/login  →  GET /api/users  →  etc.            │
        │  Sends: JSON + Authorization: Bearer <jwt>                   │
        └──────────────────────────┬───────────────────────────────────┘
                                   │ HTTPS
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ASP.NET CORE 9 KESTREL  (port 5090)                                 │
│  /swagger (dev only)         <───  CORS: localhost:5173             │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  GLOBAL EXCEPTION MIDDLEWARE  (security headers first)               │
│  - X-Content-Type-Options: nosniff                                 │
│  - X-Frame-Options: DENY                                           │
│  - X-XSS-Protection: 1; mode=block                                 │
│  - Referrer-Policy: strict-origin-when-cross-origin               │
│  - On exception → ApiResponse.Fail(...)                            │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AUTHENTICATION (JWT Bearer)                                          │
│  - ValidateIssuer / Audience / Lifetime / SigningKey                │
│  - On failure → 401 (generic)                                       │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AUTHORIZATION                                                             │
│  [HasPermission("Feedbacks.Create")]                                │
│     → policy "Permission:Feedbacks.Create"                        │
│        → PermissionPolicyProvider                                    │
│           → PermissionAuthorizationHandler                          │
│              → IPermissionService.HasPermissionAsync                │
│                 → EffectivePermissions = Role ∪ Direct ∪ {"*"}    │
│                    → 200 OK  OR  403 Forbidden                      │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CONTROLLER (e.g., FeedbacksController)                            │
│  - Model validation (DataAnnotations)                              │
│  - Route template    (e.g., api/feedbacks/{id:guid})                │
│  - ProducesResponseType attributes                                 │
│  - Calls service layer                                              │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER (e.g., FeedbackService)                             │
│  - Business rules & validation                                    │
│  - Calls DbContext (EF Core)                                      │
│  - MapToDto() / MapToSummary()                                   │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  APPLICATIONDbContext (EF Core + SQL Server)                       │
│  - Change tracking, relationships, constraints                    │
│  - SaveChangesAsync()                                               │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SQL SERVER  (CustomerSupportDb)                                   │
│  - Tables, indexes, unique constraints, check constraints         │
└──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  REVERSE FLOW (response)                                            │
│  DTO → ApiResponse<T>.SuccessResult() → JSON → Client              │
└──────────────────────────────────────────────────────────────────────┘
```

## Typical User Journey

```text
1.  Register new user
    POST /api/auth/register  (Email, Password, Role)
    → UserManager.CreateAsync() → JWT token returned

2.  Login (login every session)
    POST /api/auth/login
    → Find user → Validate password → Generate JWT
    → Token returned with expiration (default 24h)

3.  Use the token
    GET /api/users (Bearer token)
    → Authentication → Authorization → Service → DB
    → PagedResult<UserSummaryDto> → JSON response

4.  Update user profile
    PUT /api/users/profile
    → Only allowed for self  → 403 for others
    → UserService.UpdateUserAsync()

5.  Record feedback on a completed touchpoint
    POST /api/feedbacks
    → Validate ScheduleItem exists
    → Prevent duplicate feedback per schedule item
    → Save Feedback → Return FeedbackDto
```

## Error Handling Flow

```text
REQUEST
  │
  ▼
GlobalExceptionMiddleware (caught exception)
  │
  ▼
StatusCode = exception switch
  │
  ├─ AppException      → (int)appEx.StatusCode        (400/401/403/404/422)
  ├─ UnauthorizedAccess → 401
  ├─ KeyNotFoundException → 404
  └─ else              → 500 (dev shows detail)
  │
  ▼
Response shape:
  {
    "success": false,
    "message": "...",
    "data": null,
    "errors": [...],
    "statusCode": 404,
    "timestamp": "...",
    "traceId": "..."
  }
```

## Data Flow: Feedback Record

```text
Client POST /api/feedbacks
   │
   ▼
FeedbacksController.PostFeedback()
   │
   ▼
FeedbackService.CreateFeedbackAsync(dto)
   │
   ▼
  ├─ Validate ScheduleItem exists
  ├─ Check duplicate (ScheduleItemId unique)
  ├─ Clamp rating (1-5)
  ├─ Set ResolvedAt (on Resolved/Closed)
  └─ dbContext.Feedbacks.Add() → SaveChangesAsync()
   │
   ▼
Feedback entity saved → GetFeedbackByIdAsync()
   │
   ▼
MapToDto() → FeedbackDto (with enriched parent data)
   │
   ▼
ApiResponse<FeedbackDto>.SuccessResult()
   │
   ▼
JSON → Client
```

---

## Diagram 2 — Entity Relationship Diagram

### Tables & Relationships

```text
╔══════════════════╗       ╔══════════════════╗
╔══════════════════╗       ║     Project       ║
║  Organization    ║       ╚═══════════╦══════╝
║  (Customer)      ║                 ║            ╔══════════════════╗
║                  ║       1         ║ N         ║ ProjectModule    ║
╚══════════════════╝             ╔────╫──────────╢                  ║
        │                        ║    ║         ╔╧══════════════════╗
        │       ╔════════════════╗║    ║         ║ ContactPerson    ║
        │       ║  ContactPerson ║║    ║         ║                  ║
        │       ║  (stakeholder) ║║    ║         ║                  ║
        ▼       ╚════════════════╝║    ║         ╚══════════════════╝
 ╔══════════════════╗             ║    ║
 ║   Project        ║             ║    ║
 ║                  ║             ║    ║
 ║  OrganizationId  ║◄────────────╫────╫─────────►
 ║  (FK)            ║           ╔╧════╧═══════════╗
 ║  Status          ║           ║  SupportAssignment ║
 ║  StartDate       ║           ║                  ║
 ║  ...             ║           ║  User              ║
 ╚══════════════════╝           ║  (ApplicationUser) ║
        │                       ║                  ║
        │       ╔════════════════╗  ║              ╔╧══════════════════╗
        │       ║ ScheduleItem   ║  ║              ║ SupportAssignment  ║
        │       ║ (touchpoint)   ║  ║              ║                    ║
        ▼       ╚════════════════╝  ║              ║                    ║
 ╔══════════════════╗              ║              ║                    ║
 ║   User           ║              ║              ║                    ║
 ║  (ApplicationUser)║              ║              ║                    ║
 ║  Id              ║              ║              ║                    ║
 ║  FullName        ║              ║              ║                    ║
 ║  Role            ║              ║              ║                    ║
 ║  IsActive        ║              ║              ║                    ║
 ╚══════════════════╝              ║              ║                    ║
        │                          ║              ║                    ║
        │                          ║              ║                    ║
        ▼                          ▼              ▼                    ▼
╔══════════════════╗       ╔══════════════════╗ ╔══════════════════╗
║  WeeklySchedule  ║       ║  ScheduleItem    ║ ║  Feedback        ║
║  (planning cycle)║       ║  (touchpoint)    ║ ║  (CSAT + resolution)║
╚══════════════════╝       ╚══════════════════╝ ╚══════════════════╝
   WeekStartDate    WeekEndDate   WeekNumber/Year   Status    CompletedAt   Notes
                         │
                         │ 1-to-1 strict (cascade)
                         ▼
               ╔══════════════════╗
               ║  Feedback        ║
               ║  ScheduleItemId  ║─── 1-to-1 with ScheduleItem
               ║  Rating (1-5)    ║
               ║  Priority        ║
               ║  Status          ║
               ║  Remarks         ║
               ║  ResolutionNotes ║
               ║  ResolvedAt      ║
               ╚══════════════════╝
```

### Relationship Summary Table

| Relationship | Cardinality | Delete Behavior | Notes |
|---|---|---|---|
| Organization → Project | 1 : N | Restrict | Cannot delete org with projects |
| Organization → ContactPerson | 1 : N | Cascade | |
| Project → ProjectModule | 1 : N | Cascade | |
| ProjectModule → ContactPerson | 1 : N | Restrict | |
| Project → SupportAssignment | 1 : N | Cascade | |
| ProjectModule → SupportAssignment | 1 : N | Restrict | |
| User → SupportAssignment | 1 : N | Restrict | |
| User → ScheduleItem | 1 : N | Restrict | |
| ContactPerson → ScheduleItem | 1 : N | Restrict | |
| WeeklySchedule → ScheduleItem | 1 : N | Cascade | |
| ScheduleItem → Feedback | 1 : 1 (strict) | Cascade | Unique on ScheduleItemId |

### Unique Indexes & Constraints

| Table | Constraint | Rule |
|---|---|---|
| WeeklySchedule | (Year, WeekNumber) | Unique — one schedule per ISO week |
| Feedback | ScheduleItemId | Unique — strict 1:1 with ScheduleItem |
| Feedback | Rating | Check: `Rating >= 1 AND Rating <= 5` |
| ApplicationUser | Role | Index |
| ApplicationUser | Email | Index |
| ContactPerson | OrganizationId | Index |
| ContactPerson | ProjectId | Index |
| ContactPerson | ProjectModuleId | Index |
| SupportAssignment | (UserId, ProjectId) | Index |
| ScheduleItem | AssignedUserId | Index |
| ScheduleItem | Status | Index |

---

## Diagram 3 — Permission Engine

### Policy Provider & Handler

```text
[HasPermission("Feedbacks.Create")]
   │
   ▼
AuthorizationPolicyBuilder
   │   policy = "Permission:Feedbacks.Create"
   │
   ▼
GetPolicyAsync("Permission:Feedbacks.Create")
   │
   ▼
PermissionPolicyProvider
   │
   ▼
PermissionAuthorizationHandler
   │
   ▼
IPermissionService.HasPermissionAsync(userId, "Feedbacks.Create")
   │
   ▼
EffectivePermissions(user) = RolePermissions ∪ DirectPermissions ∪ {"*"}
   │
   ├─ RolePermissions = roleDefaultPermissions[role] (from permissions.json)
   ├─ DirectPermissions = "Permission" claims on the user
   └─ Wildcard "*" = all permissions
   │
   ▼
HasPermissionAsync
   ├─ If effective contains "*" → true
   ├─ Else if effective contains "Feedbacks.Create" → true
   └─ Else → false
   │
   ▼
context.Succeed(requirement)  →  200 OK
context.Failed()              →  403 Forbidden
```

### Role & Permission Hierarchy

```text
User
 ├─ Role (static enum: Admin, Director, TeamLead, SupportAgent)
 └─ Direct Permissions ("Permission" claim)

Role (from permissions.json)
 └─ DefaultPermissions (list of permission strings)

Permission (string "Module.Permission" e.g. "Schedules.Execute")
 └─ Catalog modules & descriptions (permissions.json)
```

### Default Role Matrix

| Role | Status | Key Permissions |
|---|---|---|
| **Admin** | Full access | Users.View/Create/Edit/Delete/ManageRoles/ManagePermissions, Roles.*, Organizations.* |
| **Director** | Read / oversight | Users.View, Roles.View, Organizations.View, Projects.View, Modules.View, Assignments.View, Schedules.View, Feedbacks.View/Edit, Reports.View/Export |
| **TeamLead** | Full operational | + Projects.Create/Edit/Delete, Modules.* (4), Assignments.Manage, Schedules.*, Feedbacks.* (3), Reports.View |
| **SupportAgent** | Read / execute | Organizations.View, Projects.View, Modules.View, Assignments.View, Schedules.View/Execute, Feedbacks.View/Create |

### Permission Management API

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/api/permissions?role=` | Roles.View | Get catalog / single role |
| GET | `/api/permissions/roles` | Roles.View | List roles with counts |
| PUT | `/api/permissions/roles` | Roles.Manage | Update role permissions (encrypted payload) |
| GET | `/api/permissions/me` | — | Effective permissions of the current user |
| POST | `/api/permissions/reload` | Roles.Manage | Reload from permissions.json |

### Authorization Decision Tree

```text
User requests resource
   │
   ▼
Is user authenticated?  →  NO → 401
   │
   YES
   │
   ▼
Is user active?  →  NO → 403 (inactive account)
   │
   YES
   │
   ▼
Does user have required permission?
   │
   ├─ YES → Allow
   └─ NO  → 403 Forbidden
```

---

## Diagram 4 — Local Setup & Seed Flow

### Infrastructure & Startup Sequence

```text
1.  Install .NET 9.0 SDK (global.json pins 9.0.320)
2.  Install SQL Server (LocalDB / Express / container)
3.  Configure appsettings.json:
      "DefaultConnection": "Server=.;Database=CustomerSupportDb;..."
      "JwtSettings": { "SecretKey": "...", "Issuer": "...", "Audience": "...", "ExpiryInHours": 24 }
4.  Restore & apply migrations:
      dotnet restore
      dotnet ef database update   (in Api/Implementation)
5.  Run the API:
      dotnet run --project Api/Api.csproj
6.  Startup sequence (Program.cs):
      ├─ DbContext.MigrateAsync()     → DB created/updated
      ├─ RoleService.EnsureDefaultRolesAsync() → role matrix ensured
      └─ UserService.EnsureAdminUserAsync() → admin seeded
7.  OpenAPI + Swagger UI (development only)
8.  CORS allows localhost:5173
```

### Seed Data

| Seed | Value |
|---|---|
| Admin email | `joz@gmail.com` |
| Admin username | `jo` |
| Admin password | `P@ssw0rd` |
| Admin role | `Admin` |
| Default role matrix | `permissions.json` (`roleDefaultPermissions`) |

### Configuration Files

| File | Purpose |
|---|---|
| `global.json` | .NET SDK version pin (9.0.320) |
| `Api/appsettings.json` | Connection strings, JWT, logging |
| `Api/Api.csproj` | .NET 9.0, package references, Implementation reference |
| `Api/permissions.json` | Dynamic permission catalog + role matrix |
| `Client/src/types/*.ts` | Shared TS types (UserRole, ProjectStatus, etc.) |
| `Client/src/api/*.ts` | Typed HTTP clients |
| `Client/src/components/*` | React UI components |
| `.gitignore` | Client ignore rules |
| `.freebuff/project-id` | Freebuff workspace metadata |

---

## Diagram 5 — API Boundary (All Endpoints)

### Overview

```text
╔══════════════════════════════════════════════════════════════════════╗
║  AUTHENTICATION                                                       ║
╠══════════════════════════════════════════════════════════════════════╣
║  POST  /api/auth/login               →  AuthSuccessResponseDto/401 ║
║  GET   /api/auth/me                  →  (if implemented)           ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  USERS                                                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/users?pageNumber=&pageSize=&role=&isActive=&...       ║
║  POST   /api/users                                                    ║
║  GET    /api/users/{id} or /api/users/me                             ║
║  PUT    /api/users/profile   (self)                                   ║
║  PUT    /api/users/{id}                     (Users.Edit)              ║
║  PUT    /api/users/{id}/password    (self only)                       ║
║  PUT    /api/users/{id}/status      (Users.Edit)                      ║
║  PUT    /api/users/{id}/roles       (Users.ManageRoles)               ║
║  GET    /api/users/{id}/permissions      (UserPermissionsDto)         ║
║  PUT    /api/users/{id}/permissions     (Users.ManagePermissions)     ║
║  DELETE /api/users/{id}              (Users.Delete)                   ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ROLES & PERMISSIONS                                                ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/permissions?role=                   (Roles.View)       ║
║  GET    /api/permissions/roles                   (Roles.View)       ║
║  PUT    /api/permissions/roles                       (Roles.Manage) ║
║  GET    /api/permissions/me                        (self)           ║
║  POST   /api/permissions/reload                      (Roles.Manage) ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ORGANIZATIONS (Customer Tenants)                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/organizations?searchTerm=&isActive=&...                 ║
║  POST   /api/organizations               (Organizations.Create)      ║
║  GET    /api/organizations/{id}                               (View) ║
║  PUT    /api/organizations/{id}                     (Organizations.Edit)║
║  DELETE /api/organizations/{id}                   (Organizations.Delete)║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  PROJECTS & MODULES                                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/projects?organizationId=&status=&...                    ║
║  POST   /api/projects               (Projects.Create)                ║
║  GET    /api/projects/{id}                              (Projects.View)║
║  GET    /api/projects/by-organization/{id}                   (Projects.View)║
║  PUT    /api/projects/{id}                      (Projects.Edit)        ║
║  DELETE /api/projects/{id}                      (Projects.Delete)      ║
║  GET    /api/projects/{id}/modules        (Modules.View)             ║
║  POST   /api/projects/{id}/modules   (Modules.Create)                ║
║  PUT    /api/projects/{id}/modules/{mid} (Modules.Edit)              ║
║  DELETE /api/projects/{id}/modules/{mid} (Modules.Delete)            ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  ASSIGNMENTS (Team Members)                                         ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/assignments?projectId=&projectModuleId=&userId=&...     ║
║  GET    /api/assignments/{id}                         (Assignments.View)║
║  GET    /api/assignments/by-project/{id}                 (Assignments.View)║
║  GET    /api/assignments/by-user/{userId}                (Assignments.View)║
║  POST   /api/assignments          (Assignments.Manage)               ║
║  PUT    /api/assignments/{id}             (Assignments.Manage)       ║
║  DELETE /api/assignments/{id}            (Assignments.Manage)        ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  WEEKLY SCHEDULES (Touchpoints)                                     ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/schedules?year=&weekNumber=&status=&...               ║
║  POST   /api/schedules               (Schedules.Create)              ║
║  GET    /api/schedules/current                         (Schedules.View)║
║  GET    /api/schedules/{id}                              (Schedules.View)║
║  PUT    /api/schedules/{id}                    (Schedules.Create)      ║
║  DELETE /api/schedules/{id}                    (Schedules.Create)      ║
║  POST   /api/schedules/{id}/generate                  (Schedules.Create)║
║  GET    /api/schedules/{id}/items    (Schedules.View)                ║
║  GET    /api/schedules/items/{itemId}              (Schedules.View)    ║
║  GET    /api/schedules/my-items         (Schedules.View)             ║
║  POST   /api/schedules/{id}/items  (Schedules.Assign)                ║
║  PUT    /api/schedules/items/{itemId} (Schedules.Assign)             ║
║  PATCH  /api/schedules/items/{itemId}/status (Schedules.Execute)      ║
║  DELETE /api/schedules/items/{itemId} (Schedules.Assign)             ║
╚══════════════════════════════════════════════════════════════════════╝
        │
        ▼
╔══════════════════════════════════════════════════════════════════════╗
║  FEEDBACKS (CSAT + Resolution)                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  GET    /api/feedbacks?scheduleItemId=&rating=&priority=&status=&... ║
║  GET    /api/feedbacks/analytics                         (Feedbacks.View)║
║  GET    /api/feedbacks/{id}                              (Feedbacks.View)║
║  GET    /api/feedbacks/by-schedule-item/{id}              (Feedbacks.View)║
║  POST   /api/feedbacks              (Feedbacks.Create)               ║
║  PUT    /api/feedbacks/{id}                 (Feedbacks.Edit)         ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Diagram 6 — Domain Model (Code-Level)

```text
BaseEntity (abstract)
  ├── Id (Guid) = Guid.NewGuid()
  ├── CreatedAt (DateTime)
  ├── UpdatedAt (DateTime?)

ApplicationUser : IdentityUser
  ├── FullName (string)
  ├── Role (UserRole enum)
  ├── CreatedAt (DateTime)
  ├── IsActive (bool)

Organization
  ├── Id (Guid)
  ├── Name (string, 150)
  ├── IsActive (bool)
  ├── Email (string, 100)
  ├── Phone (string, 30)
  ├── Address (string, 250)
  ├── Projects (ICollection<Project>)  1:N
  └── ContactPersons (ICollection<ContactPerson>)  1:N

Project
  ├── Id (Guid)
  ├── OrganizationId (Guid)  FK → Organization (Restrict)
  ├── Name (string, 150)
  ├── Description (string, 500)
  ├── Status (ProjectStatus: Active/Maintenance/OnHold/Completed/Archived)
  ├── StartDate (DateTime?)
  ├── EndDate (DateTime?)
  ├── ContactPersonName (string, 120)
  ├── ContactPersonPhone (string, 30)
  ├── SecondaryContactPersonName (string, 120)
  ├── SecondaryContactPersonPhone (string, 30)
  ├── ProjectModules (ICollection<ProjectModule>)  1:N
  ├── ContactPersons (ICollection<ContactPerson>)  1:N
  └── SupportAssignments (ICollection<SupportAssignment>)  1:N

ProjectModule
  ├── Id (Guid)
  ├── ProjectId (Guid)  FK → Project (Cascade)
  ├── Name (string, 150)
  ├── Description (string, 500)
  ├── Version (string, 50, default v1.0)
  ├── IsEnabled (bool, default true)
  ├── CustomNotes (string, 500)
  ├── ContactPersonName (string, 120)
  ├── ContactPersonPhone (string, 30)
  ├── SecondaryContactPersonName (string, 120)
  ├── SecondaryContactPersonPhone (string, 30)
  ├── ContactPersons (ICollection<ContactPerson>)  1:N
  └── SupportAssignments (ICollection<SupportAssignment>)  1:N

ContactPerson
  ├── Id (Guid)
  ├── OrganizationId (Guid)  FK → Organization (Cascade)
  ├── ProjectId (Guid?)  FK → Project (Restrict)
  ├── ProjectModuleId (Guid?)  FK → ProjectModule (Restrict)
  ├── FullName (string, 120)
  ├── Phone (string, 30)
  ├── Email (string, 100)
  ├── JobTitle (string, 100)
  ├── IsPrimary (bool, default false)
  ├── IsActive (bool, default true)
  ├── Notes (string, 500)
  ├── ScheduleItems (ICollection<ScheduleItem>)  1:N

SupportAssignment
  ├── Id (Guid)
  ├── UserId (string)  FK → ApplicationUser (Restrict)
  ├── ProjectId (Guid)  FK → Project (Cascade)
  ├── ProjectModuleId (Guid?)  FK → ProjectModule (Restrict)
  ├── IsActive (bool, default true)
  ├── AssignedAt (DateTime, default UTC now)
  ├── Notes (string, 500)
  ├── User (ApplicationUser)
  ├── Project (Project)
  └── ProjectModule (ProjectModule)

WeeklySchedule
  ├── Id (Guid)
  ├── WeekStartDate (DateTime)
  ├── WeekEndDate (DateTime)
  ├── WeekNumber (int)
  ├── Year (int)
  ├── Status (WeeklyScheduleStatus: Draft/Active/Completed)
  ├── Notes (string, 500)
  └── ScheduleItems (ICollection<ScheduleItem>)  1:N

ScheduleItem
  ├── Id (Guid)
  ├── WeeklyScheduleId (Guid)  FK → WeeklySchedule (Cascade)
  ├── AssignedUserId (string)  FK → ApplicationUser (Restrict)
  ├── ContactPersonId (Guid)  FK → ContactPerson (Restrict)
  ├── ScheduledDate (DateTime?)
  ├── Status (ScheduleItemStatus: Pending/Completed/Skipped)
  ├── CompletedAt (DateTime?)
  ├── Notes (string, 500)
  ├── WeeklySchedule (WeeklySchedule)
  ├── AssignedUser (ApplicationUser)
  ├── ContactPerson (ContactPerson)
  └── Feedback (Feedback)  1:1

Feedback
  ├── Id (Guid)
  ├── ScheduleItemId (Guid)  FK → ScheduleItem (Cascade, 1:1 strict)
  ├── Rating (int, 1-5)
  ├── Priority (FeedbackPriority: Low/Medium/High/Blocker)
  ├── Status (FeedbackStatus: Open/InProgress/Resolved/Closed)
  ├── Remarks (string, 1000)
  ├── ResolutionNotes (string, 1000)
  ├── ResolvedAt (DateTime?)
  ├── ScheduleItem (ScheduleItem)
```
