using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BudgetTracker.Api.Models;
using BudgetTracker.Api.Services;
using System.Security.Claims;

namespace BudgetTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize]  // Temporarily disabled for local testing
public class BudgetsController : ControllerBase
{
    private readonly ICosmosDbService<Budget> _cosmosDbService;
    private readonly ILogger<BudgetsController> _logger;

    public BudgetsController(
        ICosmosDbService<Budget> cosmosDbService,
        ILogger<BudgetsController> logger)
    {
        _cosmosDbService = cosmosDbService;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("oid")?.Value
            ?? "anonymous";
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Budget>>> GetBudgets()
    {
        try
        {
            var userId = GetUserId();
            var budgets = await _cosmosDbService.GetItemsAsync(userId);
            return Ok(budgets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving budgets");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Budget>> GetBudget(string id)
    {
        try
        {
            var userId = GetUserId();
            var budget = await _cosmosDbService.GetItemAsync(id, userId);

            if (budget == null)
                return NotFound();

            return Ok(budget);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving budget {BudgetId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Budget>> CreateBudget([FromBody] Budget budget)
    {
        try
        {
            budget.UserId = GetUserId();
            budget.Id = Guid.NewGuid().ToString();
            budget.CreatedAt = DateTime.UtcNow;
            budget.UpdatedAt = DateTime.UtcNow;

            var createdBudget = await _cosmosDbService.AddItemAsync(budget);
            return CreatedAtAction(nameof(GetBudget), new { id = createdBudget.Id }, createdBudget);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating budget");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBudget(string id, [FromBody] Budget budget)
    {
        try
        {
            var userId = GetUserId();
            var existing = await _cosmosDbService.GetItemAsync(id, userId);

            if (existing == null)
                return NotFound();

            budget.Id = id;
            budget.UserId = userId;
            budget.UpdatedAt = DateTime.UtcNow;

            await _cosmosDbService.UpdateItemAsync(id, budget);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating budget {BudgetId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBudget(string id)
    {
        try
        {
            var userId = GetUserId();
            var existing = await _cosmosDbService.GetItemAsync(id, userId);

            if (existing == null)
                return NotFound();

            await _cosmosDbService.DeleteItemAsync(id, userId);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting budget {BudgetId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
