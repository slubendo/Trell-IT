namespace TrelloLike.Models;
public class Trello
{
  public int Id { get; set; }
  public int TrelloPersonId { get; set; }
  public string Content { get; set; } = "";
  public string Section { get; set; } = "";
  public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("MMM dd");
}
