namespace TrelloLike.Models;
public class Trello
{
  public int Id { get; set; }
  public string Content { get; set; } = "";
  public string Section { get; set; }
  public DateTime CreatedAt { get; set; }
}
