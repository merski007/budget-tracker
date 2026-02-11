namespace BudgetTracker.Api.Services;

public interface ICosmosDbService<T> where T : class
{
    Task<IEnumerable<T>> GetItemsAsync(string userId);
    Task<T?> GetItemAsync(string id, string userId);
    Task<T> AddItemAsync(T item);
    Task UpdateItemAsync(string id, T item);
    Task DeleteItemAsync(string id, string userId);
}
