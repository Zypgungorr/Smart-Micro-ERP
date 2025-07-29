using AkilliMikroERP.Data;
using AkilliMikroERP.Dtos;
using AkilliMikroERP.Models;
using AkilliMikroERP.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly GeminiService _geminiService;
        
        public ProductsController(ApplicationDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        // Kullanıcı ID'sini JWT token'dan al
        private Guid? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
            {
                return userId;
            }
            return null;
        }
        // GET: api/products?search=xyz
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(string? search = null)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Creator)
                .AsQueryable();

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
                    p.Description,
                    CategoryName = p.Category != null ? p.Category.Name : "",
                    p.PriceSale,
                    p.StockQuantity,
                    p.StockCritical,
                    IsCritical = p.StockQuantity <= p.StockCritical,
                    Status = p.StockQuantity > 0 ? "active" : "inactive",
                    p.CreatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        // GET api/products/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(Guid id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return NotFound();

            var result = new
            {
                product.Id,
                product.Name,
                product.Sku,
                product.Description,
                CategoryName = product.Category != null ? product.Category.Name : "",
                product.PriceSale,
                product.StockQuantity,
                product.StockCritical,
                IsCritical = product.StockQuantity <= product.StockCritical,
                Status = product.StockQuantity > 0 ? "active" : "inactive",
                product.CreatedAt
            };

            return Ok(result);
        }


        // POST api/products
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var currentUserId = GetCurrentUserId();
            if (!currentUserId.HasValue)
            {
                return Unauthorized("Kullanıcı kimliği doğrulanamadı");
            }

            var product = new Product
            {
                Name = dto.Name,
                Sku = dto.Sku,
                CategoryId = dto.CategoryId,
                PriceSale = dto.PriceSale,
                PricePurchase = dto.PricePurchase,
                StockQuantity = dto.StockQuantity,
                StockCritical = dto.StockCritical,
                Unit = dto.Unit ?? "adet",
                Description = dto.Description,
                AiDescription = dto.AiDescription,
                PhotoUrl = dto.PhotoUrl,
                CreatedBy = currentUserId.Value,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

                // PUT api/products/{id}
        [HttpPut("{id}")]
        [AllowAnonymous]
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
            product.Unit = dto.Unit ?? "adet";
            product.Description = dto.Description;
            product.AiDescription = dto.AiDescription;
            product.PhotoUrl = dto.PhotoUrl;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE api/products/{id}
        [HttpDelete("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> Delete(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET api/products/suggest-price
        [HttpGet("suggest-price")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSuggestedPrice([FromQuery] string productName, [FromQuery] string category, [FromQuery] decimal? purchasePrice = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(productName) || string.IsNullOrWhiteSpace(category))
                {
                    return BadRequest("Ürün adı ve kategori gereklidir.");
                }

                var (suggestedPrice, priceRange) = await _geminiService.GetSuggestedPrice(
                    productName, 
                    category, 
                    purchasePrice ?? 0
                );

                if (priceRange.HasValue)
                {
                    return Ok(new { suggestedPrice, priceRange = new { min = priceRange.Value.Min, max = priceRange.Value.Max } });
                }

                return Ok(new { suggestedPrice });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Fiyat önerisi alınırken hata oluştu.", details = ex.Message });
            }
        }

        // GET api/products/estimate-stock-out
        [HttpGet("estimate-stock-out")]
        [AllowAnonymous]
        public async Task<IActionResult> GetEstimatedStockOutDays([FromQuery] string productName, [FromQuery] string category, [FromQuery] int currentStock, [FromQuery] int? monthlySales = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(productName) || string.IsNullOrWhiteSpace(category))
                {
                    return BadRequest("Ürün adı ve kategori gereklidir.");
                }

                var estimatedDays = await _geminiService.GetEstimatedStockOutDays(
                    productName, 
                    category, 
                    currentStock, 
                    monthlySales ?? 0
                );

                return Ok(new { estimatedDays });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Stok tahmini alınırken hata oluştu.", details = ex.Message });
            }
        }
    }
}
