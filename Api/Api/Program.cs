using System.Text;
using Api.Authorization;
using Api.Middleware;
using Implementation.Datas;
using Implementation.Helpers;
using Implementation.Interfaces;
using Implementation.Interfaces.Authorization;
using Implementation.Interfaces.UserMgt;
using Implementation.Interfaces.Organizations;
using Implementation.Interfaces.Projects;
using Implementation.Interfaces.Modules;
using Implementation.Interfaces.Assignments;
using Implementation.Interfaces.Schedules;
using Implementation.Interfaces.Feedbacks;
using Implementation.Interfaces.Notifications;
using Implementation.Services.Organizations;
using Implementation.Services.Projects;
using Implementation.Services.Modules;
using Implementation.Services.Assignments;
using Implementation.Services.Schedules;
using Implementation.Services.Feedbacks;
using Implementation.Services.Notifications;
using Implementation.Services;
using Implementation.Services.Authorization;
using Implementation.Services.UserMgt;
using Infrustructure.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Suppress verbose EF Core SQL commands while allowing applied migration names to display
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.Warning);
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Migrations", LogLevel.Warning);

// 1. Database Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .ConfigureWarnings(w => w
               .Ignore(RelationalEventId.PendingModelChangesWarning)
               .Ignore(new EventId(10628))
               .Ignore(new EventId(20411))));

// 2. Identity Configuration (Roles are static enums; table removed)
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddUserStore<CustomUserStore>()
.AddDefaultTokenProviders();

// 3. JWT & Encryption Configuration
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));
var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();
SecurityHelper.Initialize(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };
});

// 4. Dynamic Permissions & Authorization Configuration
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization();

// 5. Application Services (Auth, Roles, Dynamic Permissions & User Management)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IModuleService, ModuleService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// 6. CORS for Frontend Client (production and development)
var allowedHosts = builder.Configuration["AllowedHosts"]?.Split([','], StringSplitOptions.RemoveEmptyEntries)
    .Select(h => h.Trim()).ToList() ?? new List<string> { "*" };

var allowedOrigins = new List<string>();
foreach (var host in allowedHosts)
{
    if (host == "*")
    {
        allowedOrigins.Add("*");
    }
    else
    {
        allowedOrigins.AddRange(host.Split([';'], StringSplitOptions.RemoveEmptyEntries)
            .Select(h => h.Trim())
            .Where(h => !string.IsNullOrWhiteSpace(h)));
    }
}

// Explicitly allow the UI during local testing (Vite dev server) before it is published.
allowedOrigins.AddRange(new[]
{
    "https://localhost:5173",
    "https://localhost:5163",
    "http://localhost:5173",
    "http://localhost:5163",
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApp", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// 7. Swagger Documentation Generator (with JWT Bearer Support)
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Customer Support System API",
        Version = "v1",
        Description = "Enterprise Customer Support System API with Dynamic Role & Permission Engine"
    });

    // Add JWT Bearer Authentication definition
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your_token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 8. Seed Default Roles and Admin User on Startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();

    var roleService = scope.ServiceProvider.GetRequiredService<IRoleService>();
    await roleService.EnsureDefaultRolesAsync();
    var userService = scope.ServiceProvider.GetRequiredService<IUserService>();
    await userService.EnsureAdminUserAsync();

    // Ensure Notifications table exists
    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            @"IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Notifications')
              BEGIN
                  CREATE TABLE Notifications (
                      Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                      UserId NVARCHAR(450) NOT NULL,
                      Title NVARCHAR(150) NOT NULL,
                      Message NVARCHAR(1000) NOT NULL,
                      Type NVARCHAR(50) NOT NULL DEFAULT 'Info',
                      IsRead BIT NOT NULL DEFAULT 0,
                      RelatedEntityId NVARCHAR(100) NULL,
                      CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                      ReadAt DATETIME2 NULL
                  );
                  CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications (UserId, IsRead);
                  CREATE INDEX IX_Notifications_CreatedAt ON Notifications (CreatedAt DESC);
              END");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not ensure Notifications table exists");
    }

    // Ensure WeeklySchedules index is non-unique to allow multiple sub-week / custom coverage periods
    try
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            @"IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_WeeklySchedules_Year_WeekNumber' AND is_unique = 1)
              BEGIN
                  DROP INDEX IX_WeeklySchedules_Year_WeekNumber ON WeeklySchedules;
                  CREATE INDEX IX_WeeklySchedules_Year_WeekNumber ON WeeklySchedules (Year, WeekNumber);
              END");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Could not adjust index IX_WeeklySchedules_Year_WeekNumber");
    }
}

// 9. Security Headers & Global Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// 10. Swagger / OpenAPI Documentation (Development Environment Only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Customer Support API v1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "Customer Support System API - Swagger UI";
    });
}

app.UseHttpsRedirection();

app.UseCors("AllowClientApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
