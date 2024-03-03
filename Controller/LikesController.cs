using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrelloLike.Models;
using Microsoft.AspNetCore.SignalR;
using TrelloLike.Hubs;

namespace TrelloLike.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LikesController : ControllerBase
{
    private readonly DatabaseContext _context;
    private readonly IHubContext<LikeHub> _hubContext;

    public LikesController(DatabaseContext context, IHubContext<LikeHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;

    }

   [HttpGet]
    public async Task<ActionResult<IEnumerable<Like>>> GetLikeItems()
    {
      
        return await _context.Likes.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Like>> GetLikeItem(int id)
    {
        var LikeItem = await _context.Likes.FindAsync(id);

        if (LikeItem == null)
        {
            return NotFound();
        }

        return LikeItem;
    }

   [HttpPost]
    public async Task<ActionResult<Like>> PostLikeItem(Like Like)
    {
        _context.Likes.Add(Like);
        await _context.SaveChangesAsync();


        return CreatedAtAction(nameof(GetLikeItem), new { id = Like.Id }, Like);
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> PutLikeItem(int id, Like Like)
    {
        if (id != Like.Id)
        {
            return BadRequest();
        }

        _context.Entry(Like).State = EntityState.Modified;
        await _context.SaveChangesAsync();


        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLikeItem(int id)
    {
        var LikeItem = await _context.Likes.FindAsync(id);
        if (LikeItem == null)
        {
            return NotFound();
        }

        _context.Likes.Remove(LikeItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}