using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrelloLike.Models;
using Microsoft.AspNetCore.SignalR;
using TrelloLike.Hubs;

namespace TrelloLike.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrellosController : ControllerBase
{
    private readonly DatabaseContext _context;
    private readonly IHubContext<TrelloHub> _hubContext;

    public TrellosController(DatabaseContext context, IHubContext<TrelloHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;

    }

   [HttpGet]
    public async Task<ActionResult<IEnumerable<Trello>>> GetTrelloItems()
    {
      
        return await _context.Trellos.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Trello>> GetTrelloItem(int id)
    {
        var TrelloItem = await _context.Trellos.FindAsync(id);

        if (TrelloItem == null)
        {
            return NotFound();
        }

        return TrelloItem;
    }

    [HttpPost]
    public async Task<ActionResult<Trello>> PostTrelloItem(Trello Trello)
    {
        _context.Trellos.Add(Trello);
        await _context.SaveChangesAsync();

        await _hubContext.Clients.All.SendAsync("ReceiveTrello", Trello);

        return CreatedAtAction(nameof(GetTrelloItem), new { id = Trello.Id }, Trello);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutTrelloItem(int id, Trello Trello)
    {

        var existingTrello = await _context.Trellos.FindAsync(id);

        existingTrello.Content = Trello.Content;

        _context.Entry(existingTrello).State = EntityState.Modified;
        await _context.SaveChangesAsync();


        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrelloItem(int id)
    {
        var TrelloItem = await _context.Trellos.FindAsync(id);
        if (TrelloItem == null)
        {
            return NotFound();
        }

        _context.Trellos.Remove(TrelloItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}