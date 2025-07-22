// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using AutoMapper;
// using AkilliMikroERP.Data;
// using AkilliMikroERP.Models;
// using AkilliMikroERP.Dtos;

// namespace AkilliMikroERP.Controllers
// {
//     [ApiController]
//     [Route("api/[controller]")]
//     public class CustomerController : ControllerBase
//     {
//         private readonly ApplicationDbContext _context;
//         private readonly IMapper _mapper;
//         private readonly ILogger<CustomerController> _logger;

//         public CustomerController(ApplicationDbContext context, IMapper mapper, ILogger<CustomerController> logger)
//         {
//             _context = context;
//             _mapper = mapper;
//             _logger = logger;
//         }

//         // GET: api/customer
//         [HttpGet]
//         public async Task<ActionResult<IEnumerable<CustomerReadDto>>> GetAllCustomers([FromQuery] string? search = null)
//         {
//             try
//             {
//                 var query = _context.Customers.AsQueryable();

//                 if (!string.IsNullOrWhiteSpace(search))
//                 {
//                     query = query.Where(c => c.Name!.Contains(search) ||
//                                            c.Email!.Contains(search) ||
//                                            c.Phone!.Contains(search));
//                 }

//                 var customers = await query
//                     .Select(c => new CustomerReadDto
//                     {
//                         Id = c.Id,
//                         Name = c.Name,
//                         Email = c.Email,
//                         Phone = c.Phone,
//                         Address = c.Address,
//                         Type = c.Type,
//                         Segment = c.Segment,
//                         CreatedAt = c.CreatedAt,
//                         OrderCount = c.Orders != null ? c.Orders.Count : 0
//                     })
//                     .ToListAsync();

//                 return Ok(customers);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteriler getirilirken hata oluştu");
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // GET: api/customer/{id}
//         [HttpGet("{id}")]
//         public async Task<ActionResult<CustomerDetailDto>> GetCustomerById(Guid id)
//         {
//             try
//             {
//                 var customer = await _context.Customers
//                     .Include(c => c.Orders)
//                         .ThenInclude(o => o.Items)
//                             .ThenInclude(oi => oi.Product)
//                     .FirstOrDefaultAsync(c => c.Id == id);

//                 if (customer == null)
//                 {
//                     return NotFound($"ID: {id} olan müşteri bulunamadı.");
//                 }

//                 var customerDto = new CustomerDetailDto
//                 {
//                     Id = customer.Id,
//                     Name = customer.Name,
//                     Email = customer.Email,
//                     Phone = customer.Phone,
//                     Address = customer.Address,
//                     Type = customer.Type,
//                     Segment = customer.Segment,
//                     CreatedAt = customer.CreatedAt,
//                     TotalOrders = customer.Orders?.Count ?? 0,
//                     TotalOrderAmount = customer.Orders?.Sum(o => o.Items?.Sum(i => i.TotalPrice) ?? 0) ?? 0,
//                     LastOrderDate = customer.Orders?.OrderByDescending(o => o.OrderDate).FirstOrDefault()?.OrderDate,
//                     RecentOrders = customer.Orders?
//                         .OrderByDescending(o => o.OrderDate)
//                         .Take(5)
//                         .Select(o => new CustomerOrderSummaryDto
//                         {
//                             Id = o.Id,
//                             OrderDate = o.OrderDate,
//                             Status = o.Status,
//                             TotalAmount = o.Items?.Sum(i => i.TotalPrice) ?? 0,
//                             ItemCount = o.Items?.Count ?? 0
//                         })
//                         .ToList() ?? new List<CustomerOrderSummaryDto>()
//                 };

//                 return Ok(customerDto);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteri {CustomerId} getirilirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // POST: api/customer
//         [HttpPost]
//         public async Task<ActionResult<CustomerReadDto>> CreateCustomer(CustomerCreateDto dto)
//         {
//             try
//             {
//                 // Email benzersizlik kontrolü
//                 if (!string.IsNullOrWhiteSpace(dto.Email))
//                 {
//                     var existingCustomer = await _context.Customers
//                         .FirstOrDefaultAsync(c => c.Email == dto.Email);

//                     if (existingCustomer != null)
//                     {
//                         return BadRequest("Bu email adresi zaten kayıtlı.");
//                     }
//                 }

//                 var customer = new Customer
//                 {
//                     Id = Guid.NewGuid(),
//                     Name = dto.Name,
//                     Email = dto.Email,
//                     Phone = dto.Phone,
//                     Address = dto.Address,
//                     Type = dto.Type ?? "bireysel",
//                     Segment = dto.Segment,
//                     CreatedAt = DateTime.UtcNow
//                 };

//                 _context.Customers.Add(customer);
//                 await _context.SaveChangesAsync();

//                 var customerDto = new CustomerReadDto
//                 {
//                     Id = customer.Id,
//                     Name = customer.Name,
//                     Email = customer.Email,
//                     Phone = customer.Phone,
//                     Address = customer.Address,
//                     Type = customer.Type,
//                     Segment = customer.Segment,
//                     CreatedAt = customer.CreatedAt,
//                     OrderCount = 0
//                 };

//                 _logger.LogInformation("Yeni müşteri oluşturuldu: {CustomerId}, İsim: {CustomerName}", customer.Id, customer.Name);

//                 return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customerDto);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteri oluşturulurken hata oluştu");
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // PUT: api/customer/{id}
//         [HttpPut("{id}")]
//         public async Task<IActionResult> UpdateCustomer(Guid id, CustomerUpdateDto dto)
//         {
//             try
//             {
//                 if (id != dto.Id)
//                 {
//                     return BadRequest("ID uyuşmazlığı.");
//                 }

//                 var customer = await _context.Customers.FindAsync(id);
//                 if (customer == null)
//                 {
//                     return NotFound($"ID: {id} olan müşteri bulunamadı.");
//                 }

//                 // Email benzersizlik kontrolü (kendi hariç)
//                 if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != customer.Email)
//                 {
//                     var existingCustomer = await _context.Customers
//                         .FirstOrDefaultAsync(c => c.Email == dto.Email && c.Id != id);

//                     if (existingCustomer != null)
//                     {
//                         return BadRequest("Bu email adresi zaten kayıtlı.");
//                     }
//                 }

//                 customer.Name = dto.Name;
//                 customer.Email = dto.Email;
//                 customer.Phone = dto.Phone;
//                 customer.Address = dto.Address;
//                 customer.Type = dto.Type ?? customer.Type;
//                 customer.Segment = dto.Segment;

//                 await _context.SaveChangesAsync();

//                 _logger.LogInformation("Müşteri güncellendi: {CustomerId}, İsim: {CustomerName}", customer.Id, customer.Name);

//                 return NoContent();
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteri {CustomerId} güncellenirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // DELETE: api/customer/{id}
//         [HttpDelete("{id}")]
//         public async Task<IActionResult> DeleteCustomer(Guid id)
//         {
//             try
//             {
//                 var customer = await _context.Customers
//                     .Include(c => c.Orders)
//                     .FirstOrDefaultAsync(c => c.Id == id);

//                 if (customer == null)
//                 {
//                     return NotFound($"ID: {id} olan müşteri bulunamadı.");
//                 }

//                 // Müşterinin siparişi varsa silme
//                 if (customer.Orders != null && customer.Orders.Any())
//                 {
//                     return BadRequest("Bu müşterinin siparişleri olduğu için silinemez.");
//                 }

//                 _context.Customers.Remove(customer);
//                 await _context.SaveChangesAsync();

//                 _logger.LogInformation("Müşteri silindi: {CustomerId}", id);

//                 return NoContent();
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteri {CustomerId} silinirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // GET: api/customer/stats
//         [HttpGet("stats")]
//         public async Task<ActionResult<CustomerStatsDto>> GetCustomerStats()
//         {
//             try
//             {
//                 var totalCustomers = await _context.Customers.CountAsync();
//                 var activeCustomers = await _context.Customers
//                     .Where(c => c.Orders!.Any(o => o.OrderDate >= DateTime.UtcNow.AddMonths(-3)))
//                     .CountAsync();

//                 var customerTypes = await _context.Customers
//                     .GroupBy(c => c.Type)
//                     .Select(g => new { Type = g.Key, Count = g.Count() })
//                     .ToListAsync();

//                 var customerSegments = await _context.Customers
//                     .Where(c => !string.IsNullOrEmpty(c.Segment))
//                     .GroupBy(c => c.Segment)
//                     .Select(g => new { Segment = g.Key, Count = g.Count() })
//                     .ToListAsync();

//                 var stats = new CustomerStatsDto
//                 {
//                     TotalCustomers = totalCustomers,
//                     ActiveCustomers = activeCustomers,
//                     InactiveCustomers = totalCustomers - activeCustomers,
//                     CustomersByType = customerTypes.ToDictionary(x => x.Type ?? "Bilinmiyor", x => x.Count),
//                     CustomersBySegment = customerSegments.ToDictionary(x => x.Segment ?? "Bilinmiyor", x => x.Count)
//                 };

//                 return Ok(stats);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Müşteri istatistikleri getirilirken hata oluştu");
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }
//     }
// }

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CustomerController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public IActionResult GetAll() => Ok(_context.Customers.ToList());

    [HttpGet("{id}")]
    public IActionResult Get(Guid id)
    {
        var customer = _context.Customers.Find(id);
        return customer == null ? NotFound() : Ok(customer);
    }

    [HttpPost]
    public IActionResult Create([FromBody] CustomerCreateDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            Type = dto.Type,
            Segment = dto.Segment
        };

        _context.Customers.Add(customer);
        _context.SaveChanges();

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public IActionResult Update(Guid id, [FromBody] CustomerCreateDto dto)
    {
        var customer = _context.Customers.Find(id);
        if (customer == null) return NotFound();

        customer.Name = dto.Name;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;
        customer.Type = dto.Type;
        customer.Segment = dto.Segment;

        _context.SaveChanges();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(Guid id)
    {
        var customer = _context.Customers.Find(id);
        if (customer == null) return NotFound();

        _context.Customers.Remove(customer);
        _context.SaveChanges();
        return NoContent();
    }
}
