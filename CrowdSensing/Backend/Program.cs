using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

using Backend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Allow frontend dev origin to call API (CORS)
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Use MySQL database (change connection string as needed)
// string conString = "server=localhost;database=fwas;user=root;password=root";
// builder.Services.AddDbContext<DatabaseContext>(options =>
//     options.UseMySQL(conString)
//     );

// Use SQLite database file located in Backend/DB/CrowdSensing-DB.db (create file or change path)
string sqlitePath = Path.Combine(builder.Environment.ContentRootPath, "DB", "CrowdSensing-DB.db");
string conString = $"Data Source={sqlitePath};Foreign Keys=False";
builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseSqlite(conString)
    );

var app = builder.Build();

// Ensure tables for the current schema exist when application starts.
using (var scope = app.Services.CreateScope())
{
        var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
        await db.Database.ExecuteSqlRawAsync(@"
PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS PositionCount (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    long REAL NOT NULL,
    senderType nvarchar(10) NOT NULL,
    deviceCount int NOT NULL,
    measureTime datetime NOT NULL
);

CREATE TABLE IF NOT EXISTS SenderTypeRange (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderType nvarchar(10) NOT NULL,
    range int NOT NULL,
    FOREIGN KEY (senderType) REFERENCES PositionCount(senderType)
);
");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// enable CORS for frontend
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
