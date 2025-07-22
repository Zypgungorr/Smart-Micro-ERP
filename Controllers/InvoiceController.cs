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

            foreach (var item in invoice.Items)
            {
                if (item.Product == null)
                    Console.WriteLine($"Product not found for InvoiceItem with ProductId: {item.ProductId}");
            }

            var dto = _mapper.Map<InvoiceReadDto>(invoice);
            dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
            return Ok(dto);
        }


        // POST: api/invoice
        // [HttpPost]
        // public async Task<ActionResult<InvoiceReadDto>> CreateInvoice(InvoiceCreateDto dto)
        // {

        //     var existingInvoice = await _context.Invoices.FirstOrDefaultAsync(i => i.OrderId == dto.OrderId);
        //     if (existingInvoice != null)
        //     {
        //         return BadRequest("Bu siparişe ait zaten bir fatura oluşturulmuş.");
        //     }

        //     var invoice = _mapper.Map<Invoice>(dto);
        //     invoice.Id = Guid.NewGuid();
        //     invoice.InvoiceDate = DateTimeOffset.UtcNow;
        //     invoice.IssuedAt = DateTimeOffset.UtcNow;

        //     invoice.Items = dto.Items.Select(i => new InvoiceItem
        //     {
        //         Id = Guid.NewGuid(),
        //         InvoiceId = invoice.Id,
        //         ProductId = i.ProductId,
        //         Quantity = i.Quantity,
        //         UnitPrice = i.UnitPrice,
        //         TotalPrice = i.Quantity * i.UnitPrice
        //     }).ToList();

        //     invoice.TotalAmount = invoice.Items.Sum(i => i.TotalPrice);

        //     _context.Invoices.Add(invoice);
        //     await _context.SaveChangesAsync();

        //     var resultDto = _mapper.Map<InvoiceReadDto>(invoice);
        //     resultDto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();

        //     return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, resultDto);
        // }

        public async Task<ActionResult<InvoiceReadDto>> CreateInvoice(InvoiceCreateDto invoiceDto)
        {
            // Order var mı kontrol et (isteğe bağlı ama tavsiye edilir)
            var orderExists = await _context.Orders.AnyAsync(o => o.Id == invoiceDto.OrderId);
            if (!orderExists)
            {
                return BadRequest("Order not found");
            }

            // DTO'dan Entity'ye map et
            var invoice = _mapper.Map<Invoice>(invoiceDto);

            // Items manuel ekle (mapping profile'da ignore edilmişti)
            invoice.Items = invoiceDto.Items.Select(itemDto =>
            {
                var item = _mapper.Map<InvoiceItem>(itemDto);
                item.InvoiceId = invoice.Id; // ilişkiyi kur
                item.TotalPrice = item.Quantity * item.UnitPrice; // toplam fiyatı güncelle
                return item;
            }).ToList();

            invoice.TotalAmount = invoice.Items.Sum(i => i.TotalPrice);

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var createdInvoice = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(ii => ii.Product)
                .FirstOrDefaultAsync(i => i.Id == invoice.Id);

            var readDto = _mapper.Map<InvoiceReadDto>(createdInvoice);

            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, readDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, InvoiceCreateDto dto)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            var existingItems = invoice.Items.ToList();
            var newItemsDto = dto.Items;

            var itemsToRemove = existingItems
                .Where(ei => !newItemsDto.Any(ni => ni.ProductId == ei.ProductId))
                .ToList();

            _context.InvoiceItems.RemoveRange(itemsToRemove);

            foreach (var existingItem in existingItems)
            {
                var updatedItemDto = newItemsDto.FirstOrDefault(ni => ni.ProductId == existingItem.ProductId);
                if (updatedItemDto != null)
                {
                    existingItem.Quantity = updatedItemDto.Quantity;
                    existingItem.UnitPrice = updatedItemDto.UnitPrice;
                    existingItem.TotalPrice = updatedItemDto.Quantity * updatedItemDto.UnitPrice;
                }
            }

            var itemsToAdd = newItemsDto
                .Where(ni => !existingItems.Any(ei => ei.ProductId == ni.ProductId))
                .ToList();

            foreach (var newItemDto in itemsToAdd)
            {
                var newItem = new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    ProductId = newItemDto.ProductId,
                    Quantity = newItemDto.Quantity,
                    UnitPrice = newItemDto.UnitPrice,
                    TotalPrice = newItemDto.Quantity * newItemDto.UnitPrice
                };
                _context.InvoiceItems.Add(newItem);
            }

            invoice.TotalAmount = invoice.Items.Sum(i => i.TotalPrice);
            invoice.InvoiceNumber = dto.InvoiceNumber;
            invoice.OrderId = dto.OrderId;
            invoice.Status = dto.Status;
            invoice.IssuedAt = dto.IssuedAt.ToUniversalTime();
            invoice.DueDate = dto.DueDate.ToUniversalTime();

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
