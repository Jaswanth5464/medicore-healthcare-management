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

// --- Auto-fix production database schema for Walk-in sales ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MediCoreDbContext>();
    db.Database.ExecuteSqlRaw(@"
        IF COL_LENGTH('Bills', 'BillSource') IS NULL 
        BEGIN
            ALTER TABLE Bills ADD BillSource nvarchar(max) NOT NULL DEFAULT 'OPD';
            ALTER TABLE Bills ALTER COLUMN PatientUserId int NULL;
            ALTER TABLE Bills ALTER COLUMN DoctorProfileId int NULL;
            ALTER TABLE Bills ALTER COLUMN AppointmentId int NULL;
            IF COL_LENGTH('Bills', 'SourceReferenceId') IS NULL 
                ALTER TABLE Bills ADD SourceReferenceId int NULL;
        END
    ");

    // Auto-seed medicines if 0
    if (!db.Medicines.Any())
    {
        db.Database.ExecuteSqlRaw(@"
            INSERT INTO Medicines (Name, GenericName, Category, Price, StockQuantity, LowStockThreshold, Manufacturer) VALUES 
            ('Paracetamol 500mg', 'Acetaminophen', 'Tablet', 5.50, 500, 50, 'GSK'),
            ('Amoxicillin 250mg', 'Amoxicillin', 'Capsule', 12.00, 200, 20, 'Novartis'),
            ('Ibuprofen 400mg', 'Ibuprofen', 'Tablet', 8.75, 300, 30, 'Pfizer'),
            ('Metformin 500mg', 'Metformin', 'Tablet', 4.20, 450, 40, 'Merck'),
            ('Cetirizine 10mg', 'Cetirizine', 'Tablet', 3.50, 600, 50, 'J&J'),
            ('Azithromycin 500mg', 'Azithromycin', 'Tablet', 45.00, 100, 15, 'Sandoz'),
            ('Omeprazole 20mg', 'Omeprazole', 'Capsule', 15.30, 250, 25, 'AstraZeneca'),
            ('Atorvastatin 10mg', 'Atorvastatin', 'Tablet', 22.00, 180, 20, 'Pfizer'),
            ('Amlodipine 5mg', 'Amlodipine', 'Tablet', 6.80, 400, 35, 'Lupin'),
            ('Ciprofloxacin 500mg', 'Ciprofloxacin', 'Tablet', 18.50, 150, 20, 'Bayer'),
            ('Dolo 650', 'Paracetamol', 'Tablet', 3.20, 1000, 100, 'Micro Labs'),
            ('Combiflam', 'Ibuprofen + Paracetamol', 'Tablet', 4.50, 800, 80, 'Sanofi'),
            ('Saridon', 'Propyphenazone + Paracetamol', 'Tablet', 5.00, 500, 50, 'Bayer'),
            ('Benadryl DR', 'Dextromethorphan', 'Syrup', 115.00, 40, 10, 'J&J'),
            ('Zyrtec', 'Cetirizine', 'Tablet', 18.00, 200, 20, 'GSK'),
            ('Salbutamol Inhaler', 'Albuterol', 'Inhaler', 245.00, 30, 5, 'Cipla'),
            ('Augmentin 625 Duo', 'Amoxicillin + Clavulanic Acid', 'Tablet', 180.00, 60, 10, 'GSK'),
            ('Shelcal 500', 'Calcium + Vitamin D3', 'Tablet', 95.00, 200, 20, 'Torrent'),
            ('Volini Gel', 'Diclofenac', 'Ointment', 145.00, 60, 10, 'Sun Pharma'),
            ('Aciloc 150', 'Ranitidine', 'Tablet', 32.00, 250, 40, 'Cadila'),
            ('Vicks Action 500', 'Paracetamol + Caffeine', 'Tablet', 2.50, 1200, 100, 'P&G'),
            ('Montair LC', 'Montelukast', 'Tablet', 195.00, 80, 15, 'Cipla'),
            ('Allegra 120mg', 'Fexofenadine', 'Tablet', 165.00, 75, 10, 'Sanofi'),
            ('Dettol 500ml', 'Antiseptic', 'Liquid', 185.00, 40, 5, 'Reckitt'),
            ('Glycomet GP1', 'Metformin + Glimepiride', 'Tablet', 85.00, 150, 20, 'USV'),
            ('Thyronorm 50', 'Levothyroxine', 'Tablet', 145.00, 50, 5, 'Abbott'),
            ('Limcee 500mg', 'Vitamin C', 'Tablet', 25.00, 400, 50, 'Abbott'),
            ('Becosules', 'B-Complex', 'Capsule', 45.00, 350, 35, 'Pfizer'),
            ('Shelcal CT', 'Vitamin D', 'Tablet', 110.00, 120, 20, 'Torrent'),
            ('Moov Spray', 'Pain Relief', 'Spray', 165.00, 40, 5, 'Reckitt'),
            ('Otrivin Oxy', 'Nasal Spray', 'Spray', 95.00, 100, 15, 'GSK'),
            ('Ondem 4mg', 'Ondansetron', 'Tablet', 45.00, 150, 30, 'Alkem'),
            ('Cyclopam', 'Dicyclomine', 'Tablet', 35.00, 200, 40, 'Indoco'),
            ('Folvite 5mg', 'Folic Acid', 'Tablet', 55.00, 300, 50, 'Pfizer'),
            ('Zincovit', 'Multivitamin', 'Tablet', 105.00, 400, 50, 'Apex'),
            ('Telma 40', 'Telmisartan', 'Tablet', 115.00, 200, 30, 'Glenmark'),
            ('Amlong 5', 'Amlodipine', 'Tablet', 65.00, 150, 25, 'Micro Labs'),
            ('Pantocid 40', 'Pantoprazole', 'Tablet', 110.00, 300, 40, 'Sun Pharma'),
            ('Rantac 150', 'Ranitidine', 'Tablet', 38.00, 400, 50, 'JB Chemicals'),
            ('Digene Tablet', 'Antacid', 'Tablet', 25.00, 500, 50, 'Abbott'),
            ('Saridon Advance', 'Pain Relief', 'Tablet', 5.00, 800, 80, 'Bayer'),
            ('Strepsils', 'Honey Lemon', 'Lozenge', 3.50, 1000, 100, 'Reckitt'),
            ('Vicks VapoRub', 'Balm', 'Balm', 125.00, 50, 10, 'P&G'),
            ('Revital H', 'Multivitamin', 'Capsule', 310.00, 40, 10, 'Sun Pharma'),
            ('Spasmo-Proxyvon+', 'Antispasmodic', 'Capsule', 145.00, 60, 15, 'Wockhardt'),
            ('Loperamide 2mg', 'Anti-diarrheal', 'Tablet', 12.00, 200, 30, 'J&J'),
            ('Dulcolax 5mg', 'Laxative', 'Tablet', 10.00, 300, 50, 'Boehringer'),
            ('Gelusil Liquid', 'Antacid', 'Syrup', 135.00, 30, 5, 'Pfizer'),
            ('Crocin Pain Relief', 'Caffeine + Paracetamol', 'Tablet', 6.00, 700, 70, 'GSK'),
            ('Erythromycin 500mg', 'Erythromycin', 'Tablet', 24.00, 100, 15, 'Abbott')
        ");
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