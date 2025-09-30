using Microsoft.AspNetCore.SignalR;
using System.Text.Json;


namespace TrelloLike.Hubs;

public class TrelloLikeHub : Hub
{

  public override Task OnConnectedAsync()
  {
    Console.WriteLine("A Client Connected: " + Context.ConnectionId);
    return base.OnConnectedAsync();
  }

  public override Task OnDisconnectedAsync(Exception exception)
  {
    Console.WriteLine("A client disconnected: " + Context.ConnectionId);
    return base.OnDisconnectedAsync(exception);
  }
  public async Task CreateLike(TrelloLike.Models.TrelloLike like)
  {
    Console.WriteLine($"Received like: {JsonSerializer.Serialize(like)}");
    await Clients.All.SendAsync("ReceiveLike", like);
  }
    public async Task UpdateLike(int id)
    {
    
        Console.WriteLine($"Updated like with id: {id}");
        await Clients.All.SendAsync("UpdateLike", id);

    }
}