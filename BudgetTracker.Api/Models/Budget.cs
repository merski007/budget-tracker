using Newtonsoft.Json;

namespace BudgetTracker.Api.Models;

public class Budget
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonProperty("name")]
    public string Name { get; set; } = string.Empty;

    [JsonProperty("amount")]
    public decimal Amount { get; set; }

    [JsonProperty("spent")]
    public decimal Spent { get; set; }

    [JsonProperty("category")]
    public string? Category { get; set; }

    [JsonProperty("startDate")]
    public DateTime? StartDate { get; set; }

    [JsonProperty("endDate")]
    public DateTime? EndDate { get; set; }

    [JsonProperty("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonProperty("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
