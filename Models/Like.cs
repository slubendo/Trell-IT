namespace TrelloLike.Models;

public class Like
{
    public int Id { get; set; }
    public int TrelloId { get; set; } 
    public bool Liked { get; set; } = false;
}
