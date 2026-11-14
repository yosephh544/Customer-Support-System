## A. Diagrams to Convert to PDF

- `diagram-flowchart.md` — **Implementation & request flow** (pipeline with numbered steps, error path, and data flow).
- `diagram-erd.md` — **Entity Relationship Diagram** (tables, keys, cardinalities, constraints) plus the **domain class map**.
- `diagram-permissions.md` — **Permission/role model** (policy provider → handler → service → user effective permissions).
- `diagram-env-setup.md` — **Local setup** (infrastructure + seed flow + config).
- `diagram-api-entrypoints.md` — **API boundary** (all resource endpoints at a glance).

Put each file beside `README.md` and link to it in the "Diagrams" section of the README (`[17. Diagrams]`), then export the `.md` files to PDF using any Markdown-to-PDF converter (Pandoc, VS Code "Markdown PDF", Typora, or a print-to-PDF browser render).

---

## B. How to Convert to PDF

1. **Export from the README**: render `README.md` in a Markdown editor (e.g., VS Code with "Markdown PDF", Typora, Obsidian) and choose **Export → PDF**.
2. **Append the diagrams**: after you have exported the README, paste the diagram `.md` files into the export, or export each diagram file separately and merge them.
3. **Export each diagram file individually** if you want each diagram to start on its own page.
4. **Use a print-friendly theme** so headings, tables, and ASCII diagrams stay legible at PDF page size.
5. **Include a table of contents** (add one at the top of the combined PDF, or use a Markdown TOC generator).

> Tip: ASCII diagrams are best left as monospace sections with a ````txt`/``` box, or converted to a vector drawing tool (draw.io, PlantUML, Mermaid, Lucidchart) for a cleaner PDF export.

---

## C. Markov Chain Notes (from this conversation, not to commit)

* These notes are a record of the code I read and the decisions I made while generating the README. They are not part of the final deliverable.

### Domain model recap (from source)
- **Organization (Customer)** → 1:N → **Project** (@OnDelete.Restrict)
- **Project** → 1:N → **ProjectModule** (@OnDelete.Cascade)
- **ProjectModule** → 1:N → **ContactPerson** (@OnDelete.Restrict)
- **Project** → 1:N → **SupportAssignment** (@OnDelete.Cascade)
- **ProjectModule** → 1:N → **SupportAssignment** (@OnDelete.Restrict)
- **ApplicationUser** → 1:N → **SupportAssignment** (@OnDelete.Restrict)
- **ApplicationUser** → 1:N → **ScheduleItem** (@OnDelete.Restrict)
- **ContactPerson** → 1:N → **ScheduleItem** (@OnDelete.Restrict)
- **WeeklySchedule** → 1:N → **ScheduleItem** (@OnDelete.Cascade)
- **ScheduleItem** → **Feedback** 1:1 strict (@OnDelete.Cascade, unique on ScheduleItemId)
- **Feedback** fields: ScheduleItemId, Rating (1-5), Priority, Status, Remarks, ResolutionNotes, ResolvedAt

### Role matrix (permissions.json → roleDefaultPermissions)
- **Admin** — Users & Organizations management (11 permissions: Users.* ×6, Roles.* ×2, Organizations.* ×3)
- **Director** — View + read: Users.View, Roles.View, Organizations.View, Projects.View, Modules.View, Assignments.View, Schedules.View, Feedbacks.View/Edit, Reports.View/Export
- **TeamLead** — Full operational: Projects → Create/Edit/Delete (+View), Modules → Create/Edit/Delete (+View), Assignments → Manage (+View), Schedules → View/Create/Assign/Execute, Feedbacks → View/Create/Edit, Reports.View
- **SupportAgent** — View: Organizations, Projects, Modules; View/Execute: Assignments, Schedules; View/Create: Feedbacks

### ENRD key naming
| Entity | Primary Key | Important FK | Unique constraints |
|---|---|---|---|
| Organization | Id (Guid) | — | — |
| Project | Id (Guid) | OrganizationId (→Restrict) | — |
| ProjectModule | Id (Guid) | ProjectId (→Cascade) | — |
| ContactPerson | Id (Guid) | OrganizationId (→Cascade), ProjectId (→Restrict), ProjectModuleId (→Restrict) | — |
| SupportAssignment | Id (Guid) | UserId (→Restrict), ProjectId (→Cascade), ProjectModuleId (→Restrict) | — |
| WeeklySchedule | Id (Guid) | — | Unique: (Year, WeekNumber) |
| ScheduleItem | Id (Guid) | WeeklyScheduleId (→Cascade), AssignedUserId (→Restrict), ContactPersonId (→Restrict) | — |
| Feedback | Id (Guid) | ScheduleItemId (→Cascade, 1:1 strict) | Unique on ScheduleItemId; Check: Rating 1-5 |

### ASP.NET Core 9 startup order (Program.cs)
1. DbContext (SQL Server)
2. Identity + CustomUserStore
3. JWT + Encryption (SecurityHelper.Initialize with SecretKey)
4. Dynamic permissions (PolicyProvider + AuthorizationHandler)
5. Application services (DI)
6. CORS (AllowClientApp for localhost:5173)
7. MVC/Controllers + JSON enum converter
8. Swagger (development only)
9. Seed: Database.MigrateAsync → EnsureDefaultRolesAsync → EnsureAdminUserAsync
10. Middleware: GlobalExceptionMiddleware → Swagger (dev) → UseHttpsRedirection → UseCors → UseAuthentication → UseAuthorization → MapControllers

### Auth + permission flow
- **Login**: POST /api/auth/login → AuthService (find by username/email) → generic error → account lockout (5 failed / 15 min) → password decrypt + validate → JWT claims (NameIdentifier, Email, Name, Role, Jti) → 24h expiry
- **Authorization**: [HasPermission("X")] → policy "Permission:X" → PermissionPolicyProvider → PermissionRequirement → AuthorizationHandler → IPermissionService.HasPermissionAsync (role defaults + direct claims + wildcard) → 200/403
- **Permission data**: dynamic config in permissions.json (modules + roleDefaultPermissions); roles are static enums only
- **Encoding**: AES-256-CBC (SecurityHelper); passwords/permissions encrypted/decrypted in payloads; no-store on auth responses; default admin seeded at startup (joz@gmail.com / P@ssw0rd)

### API surface (resources)
- `/api/auth/login` (POST)
- `/api/permissions` (GET, Roles.View), `/api/permissions/roles` (GET/PUT, Roles.View/Manage), `/api/permissions/me` (GET), `/api/permissions/reload` (POST)
- `/api/users` (GET/POST, Users.View/Create), `/api/users/{id}` (GET/PUT/DELETE), `/api/users/me` (GET/PUT), `/api/users/{id}/password` (PUT), `/api/users/{id}/status` (PUT), `/api/users/{id}/roles` (PUT), `/api/users/{id}/permissions` (GET/PUT)
- `/api/organizations` (GET/POST/PUT/DELETE, Organizations.*)
- `/api/projects` (GET/POST/PUT/DELETE, Projects.*), `/api/projects/{id}/modules` (GET/POST/PUT/DELETE, Modules.*)
- `/api/assignments` (GET/POST/PUT/DELETE, Assignments.*)
- `/api/schedules` (GET/POST/PUT/DELETE + /current + /{id}/generate, Schedules.*)
- `/api/schedules/{scheduleId}/items` (GET/POST/PUT/DELETE)
- `/api/feedbacks` (GET/POST/PUT + /analytics, Feedbacks.*)

### Pagination & response shape
- `PaginationRequest`: PageNumber (min 1), PageSize (1–100), SearchTerm, SortBy, SortDirection
- `PagedResult<T>`: Items, PageNumber, PageSize, TotalCount, TotalPages, HasPreviousPage, HasNextPage
- All list endpoints return `ApiResponse<PagedResult<T>>` with `success`, `message`, `data`, `errors`, `statusCode`, `timestamp`, `traceId`
- Error mapping: NotFoundException=404, BadRequestException=400, ForbiddenException=403, UnauthorizedException=401, ValidationException=422, other=500

### Configuration files
- `Api/appsettings.json` / `appsettings.Development.json` (ConnectionStrings, JwtSettings, Logging)
- `Api/Api.csproj` (net9.0, packages: OpenApi 9.0.22, JWT Bearer 9.0.2, EF Core Design 9.0.2, Swashbuckle 7.3.2, Implementation reference, permissions.json copied to output)
- `Client/src/types/*.ts` (shared TypeScript types), `Client/src/api/*.ts` (HTTP clients), `Client/src/components/*` (React UI)
- `.gitignore` (Client), `global.json` (sdk 9.0.320, rollForward disable), `.freebuff/project-id`

### Implementation flow (on request)
- Request → Middleware (security headers) → Authentication (JWT) → Authorization (HasPermission) → Controller → Service → DbContext → SQL Server → response
- Global exception middleware wraps all: handles AppException → HTTP status + message + optional field errors; unhandled → 500 (dev shows detail, production generic)

### Schema notes
- Identity tables reworked: `Users`, `UserClaims`, `UserLogins`, `UserTokens` (no AspNet prefix)
- ApplicationUser: FullName, Role (string, index), CreatedAt, IsActive
- EF Core: OnModelCreating configures relationships, indexes, constraints; migrations in `Api/Implementation/Migrations/`
- Feedbacks: strict 1:1 with ScheduleItem; rating check constraint; unique index on ScheduleItemId
- Weekly schedules: unique (Year, WeekNumber); generate distributes touchpoints Mon–Fri at 10:00 AM from active assignments with active contacts

### Security & compliance
- Cache-control: no-store on auth endpoints (tokens not cached)
- Password hashing via Identity; lockout after 5 attempts; generic error messages
- Encrypt sensitive data (passwords, permissions) with AES-256-CBC
- XSS sanitization: SanitizeText (strip script tags + HTML-encode), StripHtml
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
