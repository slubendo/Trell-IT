namespace TrelloLike.Hubs;
using Microsoft.AspNetCore.SignalR;

public class TrelloHub : Hub
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

  public async Task SendTrello(string trello)
  {
    Console.WriteLine($"Received trello: {trello}");
    await Clients.All.SendAsync("ReceiveTrello", trello);
  }
  public async Task UpdateTrello(string trello)
  {

    Console.WriteLine($"Received updated trello:");
    await Clients.All.SendAsync("UpdateTrello", trello);

  }
  
    public async Task DeleteTrello(string trello)
  {
  
      Console.WriteLine($"Deleted trello:");
      await Clients.All.SendAsync("DeletedTrello", trello);

  }

}