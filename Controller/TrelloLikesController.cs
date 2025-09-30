using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrelloLike.Models;
using Microsoft.AspNetCore.SignalR;
using TrelloLike.Hubs;

namespace TrelloLike.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrelloLikesController : ControllerBase
{
    private readonly DatabaseContext _context;
    private readonly IHubContext<TrelloLikeHub> _hubContext;

    public TrelloLikesController(DatabaseContext context, IHubContext<TrelloLikeHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;

    }

   [HttpGet]
    public async Task<ActionResult<IEnumerable<TrelloLike.Models.TrelloLike>>> GetTrelloLikeItems()
    {
      
        return await _context.TrelloLikes.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrelloLike.Models.TrelloLike>> GetTrelloLikeItem(int id)
    {
        var TrelloLikeItem = await _context.TrelloLikes.FindAsync(id);

        if (TrelloLikeItem == null)
        {
            return NotFound();
        }

        return TrelloLikeItem;
    }

   [HttpPost]
    public async Task<ActionResult<TrelloLike.Models.TrelloLike>> PostTrelloLikeItem([FromBody] TrelloLike.Models.TrelloLike trelloLike)
    {
        _context.TrelloLikes.Add(trelloLike);
        await _context.SaveChangesAsync();


        return CreatedAtAction(nameof(GetTrelloLikeItem), new { id = trelloLike.Id }, trelloLike);
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> PutTrelloLikeItem(int id, TrelloLike.Models.TrelloLike TrelloLike)
    {
        if (id != TrelloLike.Id)
        {
            return BadRequest();
        }

            var existing = await _context.TrelloLikes.FindAsync(id);
        if (existing == null)
        {
            return NotFound();
        }

        // Update only the fields that should change
        existing.Liked = TrelloLike.Liked;
 

        await _context.SaveChangesAsync();


    return Ok(new { done = "done" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTrelloLikeItem(int id)
    {
        var TrelloLikeItem = await _context.TrelloLikes.FindAsync(id);
        if (TrelloLikeItem == null)
        {
            return NotFound();
        }

        _context.TrelloLikes.Remove(TrelloLikeItem);
        await _context.SaveChangesAsync();

    return Ok(new { done = "done" });
    }
}