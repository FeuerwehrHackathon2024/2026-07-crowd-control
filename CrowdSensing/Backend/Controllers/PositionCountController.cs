using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class PositionCountController : ControllerBase
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<PositionCountController> _logger;

        public PositionCountController(DatabaseContext context, ILogger<PositionCountController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PositionCount>>> GetAll()
        {
            return await _context.PositionCounts
                .OrderByDescending(p => p.MeasureTime)
                .ToListAsync();
        }

        [HttpGet("by-time")]
        public async Task<ActionResult<IEnumerable<PositionCount>>> GetByTime(
            [FromQuery] DateTime from,
            [FromQuery] DateTime? to)
        {
            var until = to ?? DateTime.UtcNow;
            if (until < from)
            {
                return BadRequest("'to' must be greater than or equal to 'from'.");
            }

            var result = await _context.PositionCounts
                .Where(p => p.MeasureTime >= from && p.MeasureTime <= until)
                .OrderByDescending(p => p.MeasureTime)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PositionCount>> GetById(int id)
        {
            var item = await _context.PositionCounts.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            return item;
        }

        [HttpPost]
        public async Task<ActionResult<PositionCount>> Create([FromBody] PositionCount positionCount)
        {
            _logger.LogInformation("Received POST request for PositionCount with data: {PositionCountData}", JsonSerializer.Serialize(positionCount));

            try
            {
                _context.PositionCounts.Add(positionCount);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully saved PositionCount with ID {Id} to database.", positionCount.Id);
                return CreatedAtAction(nameof(GetById), new { id = positionCount.Id }, positionCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving PositionCount to database. Data: {PositionCountData}", JsonSerializer.Serialize(positionCount));
                return StatusCode(500, "An internal error occurred while saving the data.");
            }
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, PositionCount positionCount)
        {
            if (id != positionCount.Id)
            {
                return BadRequest();
            }

            _context.Entry(positionCount).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.PositionCounts.AnyAsync(p => p.Id == id))
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
            var item = await _context.PositionCounts.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            _context.PositionCounts.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
