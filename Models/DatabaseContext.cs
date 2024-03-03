using Microsoft.EntityFrameworkCore;


namespace TrelloLike.Models;

public class DatabaseContext : DbContext
{
  public DatabaseContext(DbContextOptions<DatabaseContext> options)
      : base(options) { }

  public DbSet<Trello> Trellos => Set<Trello>();
  
  public DbSet<Like> Likes => Set<Like>();


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<Trello>()
        .Property(e => e.CreatedAt)
        .HasDefaultValueSql("now()");
  }
}