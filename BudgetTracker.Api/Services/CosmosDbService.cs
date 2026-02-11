using Microsoft.Azure.Cosmos;
using System.Net;

namespace BudgetTracker.Api.Services;

public class CosmosDbService<T> : ICosmosDbService<T> where T : class
{
    private readonly Container _container;

    public CosmosDbService(
        CosmosClient cosmosClient,
        string databaseName,
        string containerName)
    {
        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    public async Task<IEnumerable<T>> GetItemsAsync(string userId)
    {
        var query = _container.GetItemQueryIterator<T>(
            new QueryDefinition("SELECT * FROM c WHERE c.userId = @userId")
                .WithParameter("@userId", userId));

        var results = new List<T>();
        while (query.HasMoreResults)
        {
            var response = await query.ReadNextAsync();
            results.AddRange(response.ToList());
        }

        return results;
    }

    public async Task<T?> GetItemAsync(string id, string userId)
    {
        try
        {
            var response = await _container.ReadItemAsync<T>(id, new PartitionKey(userId));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<T> AddItemAsync(T item)
    {
        var response = await _container.CreateItemAsync(item);
        return response.Resource;
    }

    public async Task UpdateItemAsync(string id, T item)
    {
        await _container.UpsertItemAsync(item, new PartitionKey(id));
    }

    public async Task DeleteItemAsync(string id, string userId)
    {
        await _container.DeleteItemAsync<T>(id, new PartitionKey(userId));
    }
}
