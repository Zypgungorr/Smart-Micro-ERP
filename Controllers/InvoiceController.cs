using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public InvoiceController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/invoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceReadDto>>> GetAllInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .ToListAsync();

            var result = invoices.Select(invoice =>
            {
                var dto = _mapper.Map<InvoiceReadDto>(invoice);
                dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
                return dto;
            }).ToList();

            return Ok(result);
        }

        // GET: api/invoice/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceReadDto>> GetInvoiceById(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            var dto = _mapper.Map<InvoiceReadDto>(invoice);
            dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
            return Ok(dto);
        }

        // POST: api/invoice
        [HttpPost]
        public async Task<ActionResult<InvoiceReadDto>> CreateInvoice(InvoiceCreateDto dto)
        {

            var existingInvoice = await _context.Invoices.FirstOrDefaultAsync(i => i.OrderId == dto.OrderId);
            if (existingInvoice != null)
            {
                return BadRequest("Bu siparişe ait zaten bir fatura oluşturulmuş.");
            }

            var invoice = _mapper.Map<Invoice>(dto);
            invoice.Id = Guid.NewGuid();
            invoice.InvoiceDate = DateTimeOffset.UtcNow;
            invoice.IssuedAt = DateTime.UtcNow;

            invoice.Items = dto.Items.Select(i => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.Quantity * i.UnitPrice
            }).ToList();

            invoice.TotalAmount = invoice.Items.Sum(i => i.TotalPrice);

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var resultDto = _mapper.Map<InvoiceReadDto>(invoice);
            resultDto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();

            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, resultDto);
        }

        // PUT: api/invoice/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, InvoiceCreateDto dto)
        {
            var invoice = await _context.Invoices.FindAsync(id);

            if (invoice == null)
            {
                return NotFound();
            }

            // Benzersizlik kontrolü (önceki önerim)
            var existsWithSameOrderId = await _context.Invoices
                .AnyAsync(x => x.OrderId == dto.OrderId && x.Id != id);

            if (existsWithSameOrderId)
            {
                return BadRequest("Bu orderId başka bir faturada zaten kullanılıyor.");
            }

            // Güncelleme işlemi
            invoice.OrderId = dto.OrderId;
            invoice.InvoiceNumber = dto.InvoiceNumber;
            invoice.TotalAmount = dto.TotalAmount;
            invoice.IssuedAt = dto.IssuedAt.DateTime;
            invoice.DueDate = dto.DueDate.DateTime;
            invoice.Status = dto.Status;


            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/invoice/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            _context.InvoiceItems.RemoveRange(invoice.Items);
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
