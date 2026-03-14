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

// ─── CORS ──────────────────────────────────────────────────────
// Allows Angular running on port 4200 to call this API
// Without this Angular requests will be blocked by browser
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // TRUST ALL ORIGINS FOR NOW
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// ─── Middleware Pipeline ───────────────────────────────────────
// NUCLEAR CORS FIX: AT THE ABSOLUTE TOP TO CATCH PREFLIGHT OPTIONS
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Access-Control-Allow-Origin", context.Request.Headers["Origin"]);
    context.Response.Headers.Add("Access-Control-Allow-Headers", "*");
    context.Response.Headers.Add("Access-Control-Allow-Methods", "*");
    context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");

    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("OK");
        return;
    }

    await next();
});

// app.UseCors("AllowAngular"); // Replaced by manual middleware above

// Enable Swagger in all environments for verification
app.UseSwagger();
app.UseSwaggerUI();

app.UseSerilogRequestLogging();
// app.UseHttpsRedirection(); 

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<MediCoreHub>("/hubs/medicore");

app.Run();