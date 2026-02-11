using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using BudgetTracker.Api.Models;
using BudgetTracker.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173",
            builder.Configuration["FrontendUrl"] ?? "*"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAdB2C"));

builder.Services.AddAuthorization();

// Add controllers
builder.Services.AddControllers()
    .AddNewtonsoftJson(); // For JsonProperty attributes

// Add Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure storage - Use in-memory for local testing, Cosmos DB for production
var useInMemoryDb = builder.Configuration.GetValue<bool>("UseInMemoryDb", true);

if (useInMemoryDb)
{
    // In-memory storage for local development (no database needed!)
    builder.Services.AddSingleton<ICosmosDbService<Budget>, InMemoryDbService<Budget>>();
    builder.Services.AddSingleton<ICosmosDbService<Expense>, InMemoryDbService<Expense>>();
}
else
{
    // Cosmos DB for production
    builder.Services.AddSingleton<CosmosClient>(serviceProvider =>
    {
        var endpoint = builder.Configuration["CosmosDb:Endpoint"]
            ?? throw new InvalidOperationException("CosmosDb:Endpoint is not configured");
        var key = builder.Configuration["CosmosDb:Key"]
            ?? throw new InvalidOperationException("CosmosDb:Key is not configured");

        return new CosmosClient(endpoint, key);
    });

    builder.Services.AddSingleton<ICosmosDbService<Budget>>(serviceProvider =>
    {
        var cosmosClient = serviceProvider.GetRequiredService<CosmosClient>();
        var databaseName = builder.Configuration["CosmosDb:DatabaseName"] ?? "BudgetTrackerDB";
        var containerName = "Budgets";

        return new CosmosDbService<Budget>(cosmosClient, databaseName, containerName);
    });

    builder.Services.AddSingleton<ICosmosDbService<Expense>>(serviceProvider =>
    {
        var cosmosClient = serviceProvider.GetRequiredService<CosmosClient>();
        var databaseName = builder.Configuration["CosmosDb:DatabaseName"] ?? "BudgetTrackerDB";
        var containerName = "Expenses";

        return new CosmosDbService<Expense>(cosmosClient, databaseName, containerName);
    });
}

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
