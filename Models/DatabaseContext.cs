using Microsoft.EntityFrameworkCore;


namespace TrelloLike.Models;

public class DatabaseContext : DbContext
{
  public DatabaseContext(DbContextOptions<DatabaseContext> options)
      : base(options) { }

  public DbSet<Trello> Trellos => Set<Trello>();
  
  public DbSet<TrelloLike> TrelloLikes => Set<TrelloLike>();
  public DbSet<TrelloPerson> TrelloPersons => Set<TrelloPerson>();


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<TrelloLike>().ToTable("TrelloLike");
    modelBuilder.Entity<TrelloPerson>().ToTable("TrelloPerson");
    modelBuilder.Entity<Trello>().ToTable("Trello");
    
    modelBuilder.Entity<Trello>()
        .Property(e => e.CreatedAt)
        .HasDefaultValueSql("now()");
  }
}