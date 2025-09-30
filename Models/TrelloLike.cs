namespace TrelloLike.Models;

public class TrelloLike
{
    public int Id { get; set; }
    public int TrelloId { get; set; } 
    public int TrelloPersonId { get; set; } 
    public bool Liked { get; set; } = false;
}
