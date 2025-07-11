using AkilliMikroERP.Data;
using AkilliMikroERP.Dtos;
using AkilliMikroERP.Models;
using AkilliMikroERP.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/products?search=xyz
        [HttpGet]
        public async Task<IActionResult> GetAll(string? search = null)
        {
            var query = _context.Products.Include(p => p.Category).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Name!.Contains(search));
            }

            var products = await query
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Sku,
                    CategoryName = p.Category != null ? p.Category.Name : "",
                    p.PriceSale,
                    p.StockQuantity,
                    p.StockCritical,
                    IsCritical = p.StockQuantity <= p.StockCritical
                })
                .ToListAsync();

            return Ok(products);
        }

        // GET api/products/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _context.Products.Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            return Ok(product);
        }

        // POST api/products
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var product = new Product
            {
                Name = dto.Name,
                Sku = dto.Sku,
                CategoryId = dto.CategoryId,
                PriceSale = dto.PriceSale,
                PricePurchase = dto.PricePurchase,
                StockQuantity = dto.StockQuantity,
                StockCritical = dto.StockCritical,
                Unit = dto.Unit,
                Description = dto.Description,
                PhotoUrl = dto.PhotoUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
                // CreatedBy ataması yapılabilir (auth bağlamında)
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        // PUT api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] ProductUpdateDto dto)
        {
            if (id != dto.Id)
                return BadRequest("Id mismatch");

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            product.Name = dto.Name;
            product.Sku = dto.Sku;
            product.CategoryId = dto.CategoryId;
            product.PriceSale = dto.PriceSale;
            product.PricePurchase = dto.PricePurchase;
            product.StockQuantity = dto.StockQuantity;
            product.StockCritical = dto.StockCritical;
            product.Unit = dto.Unit;
            product.Description = dto.Description;
            product.PhotoUrl = dto.PhotoUrl;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/products/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
