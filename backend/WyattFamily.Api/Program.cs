using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Identity ──────────────────────────────────────────────────────
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    options.Password.RequiredLength         = 8;
    options.Password.RequireUppercase       = true;
    options.Password.RequireDigit           = true;
    options.Password.RequireNonAlphanumeric = true;
    options.User.RequireUniqueEmail         = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ── JWT Authentication ────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = builder.Configuration["Jwt:Issuer"],
        ValidAudience            = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

builder.Services.AddAuthorization();

// ── Application Services ──────────────────────────────────────────
builder.Services.AddScoped<IEmailService, SmtpEmailService>();

if (builder.Environment.IsDevelopment() &&
    builder.Configuration["Azure:BlobStorage:ConnectionString"] == "UseDevelopmentStorage=true")
{
    builder.Services.AddScoped<IBlobService, LocalFileBlobService>();
}
else
{
    builder.Services.AddScoped<IBlobService, AzureBlobService>();
}

// ── CORS ──────────────────────────────────────────────────────────
var frontendUrl = builder.Configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(frontendUrl, "https://alanwyatt.com")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ── Controllers & Swagger ─────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Allow large file uploads (2 GB) for bulk-upload endpoint
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 2_000_000_000;
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 2_000_000_000;
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Wyatt Family API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer token",
        Name        = "Authorization",
        In          = ParameterLocation.Header,
        Type        = SecuritySchemeType.Http,
        Scheme      = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        }, Array.Empty<string>()
    }});
});

// ── Stripe ────────────────────────────────────────────────────────
Stripe.StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

var app = builder.Build();

// ── Middleware pipeline ───────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Serve uploaded dev blobs as static files
    var devBlobPath = Path.Combine(app.Environment.ContentRootPath, "dev-blobs");
    Directory.CreateDirectory(devBlobPath);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(devBlobPath),
        RequestPath  = "/dev-blobs"
    });
}

app.UseCors();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Database migration & seed ─────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(scope.ServiceProvider);
}

// ── Start Vite dev server & open browser in Development ───────────
if (app.Environment.IsDevelopment())
{
    var frontendDir = Path.GetFullPath(
        Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend"));

    if (Directory.Exists(frontendDir))
    {
        var npm = OperatingSystem.IsWindows() ? "npm.cmd" : "npm";
        var vite = new System.Diagnostics.Process
        {
            StartInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName         = npm,
                Arguments        = "run dev",
                WorkingDirectory = frontendDir,
                UseShellExecute  = true,
                WindowStyle      = System.Diagnostics.ProcessWindowStyle.Minimized,
            }
        };
        vite.Start();

        // Poll until Vite is accepting connections, then open the browser
        _ = Task.Run(async () =>
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
            for (var i = 0; i < 30; i++) // up to ~30 seconds
            {
                await Task.Delay(1000);
                try
                {
                    var res = await http.GetAsync("http://localhost:5173");
                    if (res.IsSuccessStatusCode)
                    {
                        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                        {
                            FileName        = "http://localhost:5173",
                            UseShellExecute = true
                        });
                        break;
                    }
                }
                catch { /* Vite not ready yet */ }
            }
        });

        // Kill Vite when the API shuts down
        app.Lifetime.ApplicationStopping.Register(() =>
        {
            if (!vite.HasExited) { vite.Kill(entireProcessTree: true); }
        });
    }
}

app.Run();
