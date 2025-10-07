using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrelloLike.Models;
using Microsoft.AspNetCore.SignalR;

namespace TrelloLike.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrelloPersonController : ControllerBase
{
    private readonly DatabaseContext _context;

    public TrelloPersonController(DatabaseContext context)
    {
        _context = context;
    }

   [HttpGet]
    public async Task<ActionResult<IEnumerable<TrelloPerson>>> GetTrelloItems()
    {
      
        return await _context.TrelloPersons.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrelloPerson>> GetTrelloItem(int id)
    {
        var TrelloItem = await _context.TrelloPersons.FindAsync(id);

        if (TrelloItem == null)
        {
            return NotFound();
        }

        return TrelloItem;
    }

}