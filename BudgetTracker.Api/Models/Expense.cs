using Newtonsoft.Json;

namespace BudgetTracker.Api.Models;

public class Expense
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonProperty("budgetId")]
    public string? BudgetId { get; set; }

    [JsonProperty("description")]
    public string Description { get; set; } = string.Empty;

    [JsonProperty("amount")]
    public decimal Amount { get; set; }

    [JsonProperty("category")]
    public string? Category { get; set; }

    [JsonProperty("date")]
    public DateTime Date { get; set; } = DateTime.UtcNow;

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
