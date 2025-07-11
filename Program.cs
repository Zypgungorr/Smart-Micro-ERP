using AkilliMikroERP.Data;
using AkilliMikroERP.Profiles;
using AkilliMikroERP.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;

// ENV dosyasını yükle (.env içindeki ortam değişkenlerini belleğe alır)
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Ortam değişkenlerinden değerleri al
var connectionString = Environment.GetEnvironmentVariable("CONNECTIONSTRINGS__DEFAULTCONNECTION");
var jwtKey = Environment.GetEnvironmentVariable("JWT__KEY");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT__ISSUER");
var jwtAudience = Environment.GetEnvironmentVariable("JWT__AUDIENCE");

// Hataları erkenden yakalamak için kontrol
if (string.IsNullOrWhiteSpace(connectionString) || string.IsNullOrWhiteSpace(jwtKey) ||
    string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new Exception("Gerekli ortam değişkenleri (.env) eksik! Lütfen kontrol edin.");
}

// DbContext (PostgreSQL bağlantısı)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// AutoMapper profili
builder.Services.AddAutoMapper(typeof(MappingProfile));

// JWT Authentication
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
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
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };
});

// Bağımlılık enjeksiyonu (JWT servisi)
builder.Services.AddSingleton<JwtService>();

// Controller desteği + Global Authorize
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.Filters.Add(new AuthorizeFilter(policy));
});

// CORS politikası
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// Swagger (API dokümantasyonu)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Geliştirme ortamı için hata sayfası
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => "Akıllı ERP API çalışıyor!");

app.Run();
