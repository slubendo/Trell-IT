using Microsoft.AspNetCore.SignalR;

namespace TrelloLike.Hubs;

public class LikeHub : Hub
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

    public async Task UpdateLike(int id)
    {
    
        Console.WriteLine($"Received like");
        await Clients.All.SendAsync("UpdateLike", id);

    }
}