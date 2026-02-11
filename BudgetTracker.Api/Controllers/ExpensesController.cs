using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BudgetTracker.Api.Models;
using BudgetTracker.Api.Services;
using System.Security.Claims;

namespace BudgetTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize]  // Temporarily disabled for local testing
public class ExpensesController : ControllerBase
{
    private readonly ICosmosDbService<Expense> _cosmosDbService;
    private readonly ILogger<ExpensesController> _logger;

    public ExpensesController(
        ICosmosDbService<Expense> cosmosDbService,
        ILogger<ExpensesController> logger)
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
    public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses()
    {
        try
        {
            var userId = GetUserId();
            var expenses = await _cosmosDbService.GetItemsAsync(userId);
            return Ok(expenses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving expenses");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Expense>> GetExpense(string id)
    {
        try
        {
            var userId = GetUserId();
            var expense = await _cosmosDbService.GetItemAsync(id, userId);

            if (expense == null)
                return NotFound();

            return Ok(expense);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving expense {ExpenseId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<ActionResult<Expense>> CreateExpense([FromBody] Expense expense)
    {
        try
        {
            expense.UserId = GetUserId();
            expense.Id = Guid.NewGuid().ToString();
            expense.CreatedAt = DateTime.UtcNow;

            var createdExpense = await _cosmosDbService.AddItemAsync(expense);
            return CreatedAtAction(nameof(GetExpense), new { id = createdExpense.Id }, createdExpense);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating expense");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(string id, [FromBody] Expense expense)
    {
        try
        {
            var userId = GetUserId();
            var existing = await _cosmosDbService.GetItemAsync(id, userId);

            if (existing == null)
                return NotFound();

            expense.Id = id;
            expense.UserId = userId;

            await _cosmosDbService.UpdateItemAsync(id, expense);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating expense {ExpenseId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(string id)
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
            _logger.LogError(ex, "Error deleting expense {ExpenseId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
