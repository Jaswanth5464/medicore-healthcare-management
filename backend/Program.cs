using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Auth.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using MediCore.API.Services;

using MediCore.API.Infrastructure.Filters;
using MediCore.API.Hubs;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// ─── Serilog Logging ───────────────────────────────────────────
// Serilog replaces default logging
// Every request and error will be logged to console clearly
builder.Host.UseSerilog((ctx, lc) => lc
    .WriteTo.Console()
    .ReadFrom.Configuration(ctx.Configuration));

// ─── Controllers ───────────────────────────────────────────────
builder.Services.AddControllers(options =>
{
    options.Filters.Add<AuditFilter>();
});

// ─── Swagger ───────────────────────────────────────────────────
// Swagger gives you a UI to test all APIs without Postman
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MediCore HMS API",
        Version = "v1",
        Description = "Enterprise Hospital Management System API"
    });
    c.CustomSchemaIds(x => x.FullName);

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter: Bearer {your token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
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

// ─── Database ──────────────────────────────────────────────────
// Connects EF Core to SQL Server using connection string
// from appsettings.json
builder.Services.AddDbContext<MediCoreDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── JWT Authentication ────────────────────────────────────────
// Reads JWT settings from appsettings.json
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

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
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey!))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
// Auth Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSignalR();
builder.Services.AddSingleton<IUserIdProvider, NameUserIdProvider>();

// Background Hosted Services - Disabled
// builder.Services.AddHostedService<FeedbackEmailService>();
// builder.Services.AddHostedService<DailyDigestService>();
// builder.Services.AddHostedService<FollowUpReminderService>();



// ─── CORS (SignalR-compatible) ──────────────────────────────────
// Use explicit origins + built-in middleware (most reliable for SignalR + Elastic Beanstalk)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",
                "http://medicore-frontend-jaswanth.s3-website-us-east-1.amazonaws.com"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

var app = builder.Build();

// ─── Middleware Pipeline ───────────────────────────────────────
// CORS must be FIRST (before Swagger, Auth, etc.) for SignalR negotiate to succeed
app.UseCors("AllowAngular");

// Enable Swagger in all environments for verification
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
// app.UseHttpsRedirection(); 

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<MediCoreHub>("/hubs/medicore");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MediCoreDbContext>();
    // --- Auto-apply migrations (Creates tables in RDS if they don't exist) ---
    try
    {
        Log.Information("Applying database migrations...");
        await db.Database.MigrateAsync();
        
        // Call the central Seeder to populate initial data
        await MediCore.API.Infrastructure.Database.DbSeeder.SeedAsync(db);
        Log.Information("Database initialization completed successfully.");
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred during database migration/seeding.");
    }
}

app.Run();

// Custom UserIdProvider for SignalR
public class NameUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
    }
}