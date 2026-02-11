using System.Collections.Concurrent;

namespace BudgetTracker.Api.Services;

public class InMemoryDbService<T> : ICosmosDbService<T> where T : class
{
    private readonly ConcurrentDictionary<string, T> _items = new();
    private readonly System.Reflection.PropertyInfo _idProperty;
    private readonly System.Reflection.PropertyInfo _userIdProperty;

    public InMemoryDbService()
    {
        var type = typeof(T);
        _idProperty = type.GetProperty("Id") 
            ?? throw new InvalidOperationException($"Type {type.Name} must have an 'Id' property");
        _userIdProperty = type.GetProperty("UserId") 
            ?? throw new InvalidOperationException($"Type {type.Name} must have a 'UserId' property");
    }

    public Task<IEnumerable<T>> GetItemsAsync(string userId)
    {
        var items = _items.Values
            .Where(item => _userIdProperty.GetValue(item)?.ToString() == userId)
            .ToList();
        
        return Task.FromResult<IEnumerable<T>>(items);
    }

    public Task<T?> GetItemAsync(string id, string userId)
    {
        if (_items.TryGetValue(id, out var item))
        {
            var itemUserId = _userIdProperty.GetValue(item)?.ToString();
            if (itemUserId == userId)
            {
                return Task.FromResult<T?>(item);
            }
        }
        return Task.FromResult<T?>(null);
    }

    public Task<T> AddItemAsync(T item)
    {
        var id = _idProperty.GetValue(item)?.ToString() 
            ?? throw new InvalidOperationException("Item must have an Id");
        
        _items[id] = item;
        return Task.FromResult(item);
    }

    public Task UpdateItemAsync(string id, T item)
    {
        _items[id] = item;
        return Task.CompletedTask;
    }

    public Task DeleteItemAsync(string id, string userId)
    {
        _items.TryRemove(id, out _);
        return Task.CompletedTask;
    }
}
