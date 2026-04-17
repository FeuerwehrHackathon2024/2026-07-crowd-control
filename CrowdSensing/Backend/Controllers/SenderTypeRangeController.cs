using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class SenderTypeRangeController : ControllerBase
    {
        private readonly DatabaseContext _context;

        public SenderTypeRangeController(DatabaseContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SenderTypeRange>>> GetAll()
        {
            return await _context.SenderTypeRanges
                .OrderBy(s => s.SenderType)
                .ToListAsync();
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<SenderTypeRange>> GetById(int id)
        {
            var item = await _context.SenderTypeRanges.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        [HttpPost]
        public async Task<ActionResult<SenderTypeRange>> Create(SenderTypeRange senderTypeRange)
        {
            _context.SenderTypeRanges.Add(senderTypeRange);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = senderTypeRange.Id }, senderTypeRange);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, SenderTypeRange senderTypeRange)
        {
            if (id != senderTypeRange.Id)
            {
                return BadRequest();
            }

            _context.Entry(senderTypeRange).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.SenderTypeRanges.AnyAsync(s => s.Id == id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _context.SenderTypeRanges.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            _context.SenderTypeRanges.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
