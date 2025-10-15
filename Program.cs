using TrelloLike.Models;
using TrelloLike.Hubs;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OpenApi;
using TrelloLike.Controllers;
// using System.Text.Json;


DotNetEnv.Env.Load();



var MSQLHOST = Environment.GetEnvironmentVariable("MSQLHOST");
var MSQLDATABASE = Environment.GetEnvironmentVariable("MSQLDATABASE");
var MSQLUSER = Environment.GetEnvironmentVariable("MSQLUSER");
var MSQLPASSWORD = Environment.GetEnvironmentVariable("MSQLPASSWORD");
// var connectionString = $"Host={PGHOST};Database={PGDATABASE};Username={PGUSER};Password={PGPASSWORD}";

// Console.WriteLine(connectionString);


var builder = WebApplication.CreateBuilder(args);
var connectionString = $"server={MSQLHOST};user={MSQLUSER};password={MSQLPASSWORD};database={MSQLDATABASE}";
var serverVersion = new MySqlServerVersion(new Version(8, 0, 29));


builder.Services.AddDbContext<DatabaseContext>(
    opt => {
      opt
      .UseMySql(connectionString, serverVersion);
      if (builder.Environment.IsDevelopment())
      {
        opt
          .LogTo(Console.WriteLine, LogLevel.Information)
          .EnableSensitiveDataLogging()
          .EnableDetailedErrors();
      }
    }
);

builder.Services.AddControllers();
// builder.Services.AddControllers().AddJsonOptions(options =>
// {
//     options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
// });
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(
                "http://localhost:5173",       // dev
                "https://trell-it.fly.dev"        // production frontend
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // required for SignalR
        });
});


builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// if (app.Environment.IsDevelopment())
// {
//   app.UseSwagger();
//   app.UseSwaggerUI();
// }

app.UseRouting();
app.UseCors("AllowFrontend");

app.MapControllers();
app.MapHub<TrelloHub>("/r/trelloHub");
app.MapHub<TrelloLikeHub>("/r/trellolikeHub");

// app.MapGet("/", () => "Hey!");

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
    try
    {
        db.Database.OpenConnection();  // Try to open a connection
        Console.WriteLine("✅ Database connection successful!");
        db.Database.CloseConnection();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database connection failed: {ex.Message}");
    }
}


app.Run();
