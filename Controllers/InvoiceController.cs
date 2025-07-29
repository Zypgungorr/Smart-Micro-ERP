using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;
using Microsoft.AspNetCore.Authorization;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
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
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<InvoiceReadDto>>> GetAllInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Customer)
                .Include(i => i.Customer)
                .ToListAsync();

            var result = invoices.Select(invoice =>
            {
                var dto = _mapper.Map<InvoiceReadDto>(invoice);
                dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
                // Müşteri adını ekle - önce direkt Customer, sonra Order üzerinden kontrol et
                dto.CustomerName = invoice.Customer?.Name ?? invoice.Order?.Customer?.Name ?? "Bilinmeyen Müşteri";
                return dto;
            }).ToList();

            return Ok(result);
        }

        // GET: api/invoice/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<InvoiceReadDto>> GetInvoiceById(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Customer)
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            foreach (var item in invoice.Items)
            {
                if (item.Product == null)
                    Console.WriteLine($"Product not found for InvoiceItem with ProductId: {item.ProductId}");
            }

            var dto = _mapper.Map<InvoiceReadDto>(invoice);
            dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
            // Müşteri adını ekle - önce direkt Customer, sonra Order üzerinden kontrol et
            dto.CustomerName = invoice.Customer?.Name ?? invoice.Order?.Customer?.Name ?? "Bilinmeyen Müşteri";
            return Ok(dto);
        }


        // POST: api/invoice
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<InvoiceReadDto>> CreateInvoice(InvoiceCreateDto invoiceDto)
        {
            try
            {
                // Yeni fatura için Order kontrolü yapma (manuel fatura oluşturma için)
                // Sadece OrderId varsa ve boş değilse kontrol et
                if (invoiceDto.OrderId.HasValue && invoiceDto.OrderId.Value != Guid.Empty)
                {
                    var orderExists = await _context.Orders.AnyAsync(o => o.Id == invoiceDto.OrderId.Value);
            if (!orderExists)
            {
                        return BadRequest(new { message = "Belirtilen sipariş bulunamadı." });
                    }
            }

            // DTO'dan Entity'ye map et
            var invoice = _mapper.Map<Invoice>(invoiceDto);

                // OrderId null ise boş GUID ata
                if (!invoiceDto.OrderId.HasValue || invoiceDto.OrderId.Value == Guid.Empty)
                {
                    invoice.OrderId = null;
                }

                // CustomerId'yi ayarla
                if (invoiceDto.CustomerId.HasValue && invoiceDto.CustomerId.Value != Guid.Empty)
                {
                    invoice.CustomerId = invoiceDto.CustomerId.Value;
                }
                else if (!invoiceDto.OrderId.HasValue || invoiceDto.OrderId.Value == Guid.Empty)
                {
                    return BadRequest(new { message = "Manuel fatura oluştururken müşteri seçimi zorunludur." });
                }

                // Items manuel ekle
            invoice.Items = invoiceDto.Items.Select(itemDto =>
            {
                var item = _mapper.Map<InvoiceItem>(itemDto);
                    item.Id = Guid.NewGuid();
                    item.InvoiceId = invoice.Id;
                    item.TotalPrice = item.Quantity * item.UnitPrice;
                return item;
            }).ToList();

            invoice.TotalAmount = invoice.Items.Sum(i => i.TotalPrice);

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            var createdInvoice = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(ii => ii.Product)
                    .Include(i => i.Order)
                        .ThenInclude(o => o.Customer)
                    .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == invoice.Id);

            var readDto = _mapper.Map<InvoiceReadDto>(createdInvoice);
                readDto.Items = createdInvoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
                readDto.CustomerName = createdInvoice.Customer?.Name ?? createdInvoice.Order?.Customer?.Name ?? "Bilinmeyen Müşteri";

            return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, readDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Fatura oluşturulurken hata: {ex.Message}" });
            }
        }

        [HttpPut("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateInvoice(Guid id, InvoiceCreateDto dto)
        {
            try
            {
                // URL'den gelen id ile DTO'daki id'yi karşılaştır
                if (dto.Id.HasValue && dto.Id.Value != id)
                {
                    return BadRequest(new { message = "URL'deki ID ile gönderilen ID uyuşmuyor." });
                }

                // Faturayı yeniden yükle
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

                // Transaction kullanarak güvenli güncelleme
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {

            // Mevcut itemları temizle
            _context.InvoiceItems.RemoveRange(invoice.Items);
            await _context.SaveChangesAsync(); // Önce itemları kaydet

            // Yeni itemları ekle
            var newItems = dto.Items.Select(itemDto => new InvoiceItem
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                TotalPrice = itemDto.Quantity * itemDto.UnitPrice
            }).ToList();

            _context.InvoiceItems.AddRange(newItems);

            // Fatura bilgilerini güncelle
            invoice.InvoiceNumber = dto.InvoiceNumber;
            invoice.Status = dto.Status;
            invoice.TotalAmount = newItems.Sum(i => i.TotalPrice);
            
            // CustomerId'yi güncelle (sadece geçerli bir değer varsa)
            if (dto.CustomerId.HasValue && dto.CustomerId.Value != Guid.Empty)
            {
                invoice.CustomerId = dto.CustomerId.Value;
            }
            
            // Tarih alanlarını kontrol et ve güncelle
            if (dto.IssuedAt != default)
            {
            invoice.IssuedAt = dto.IssuedAt.ToUniversalTime();
            }
            
            if (dto.DueDate != default)
            {
            invoice.DueDate = dto.DueDate.ToUniversalTime();
            }
            
            if (dto.InvoiceDate != default)
            {
                invoice.InvoiceDate = dto.InvoiceDate.ToUniversalTime();
            }

            await _context.SaveChangesAsync();

            // Transaction'ı commit et
            await transaction.CommitAsync();

            // Güncellenmiş faturayı döndür
            var updatedInvoice = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Customer)
                .Include(i => i.Customer)
                .FirstOrDefaultAsync(i => i.Id == id);

            var resultDto = _mapper.Map<InvoiceReadDto>(updatedInvoice);
            resultDto.Items = updatedInvoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
            resultDto.CustomerName = updatedInvoice.Customer?.Name ?? updatedInvoice.Order?.Customer?.Name ?? "Bilinmeyen Müşteri";

            return Ok(resultDto);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Fatura güncellenirken hata: {ex.Message}" });
            }
        }




        // DELETE: api/invoice/{id}
        [HttpDelete("{id}")]
        [AllowAnonymous]
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

        // POST: api/invoice/approve/{id} - Faturayı onayla
        [HttpPost("approve/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> ApproveInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                .ThenInclude(o => o.Customer)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            if (invoice.Status != "taslak")
            {
                return BadRequest("Sadece taslak durumundaki faturalar onaylanabilir.");
            }

            // AI destekli kontroller
            var aiRecommendations = await GetAIRecommendations(invoice);

            // Faturayı onayla
            invoice.Status = "Ödenmedi";
            invoice.IssuedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Fatura başarıyla onaylandı.",
                aiRecommendations = aiRecommendations
            });
        }

        // POST: api/invoice/create-from-order/{orderId} - Siparişten fatura oluştur
        [HttpPost("create-from-order/{orderId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateInvoiceFromOrder(Guid orderId)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.Items)
                        .ThenInclude(oi => oi.Product)
                    .Include(o => o.Customer)
                    .FirstOrDefaultAsync(o => o.Id == orderId);

                if (order == null)
                {
                    return NotFound(new { message = "Sipariş bulunamadı." });
                }

                // Sipariş durumu kontrolü - sadece kargoya verilmiş siparişlerden fatura oluşturulabilir
                if (order.Status != "kargoya_verildi")
                {
                    return BadRequest(new { message = "Sadece kargoya verilmiş siparişlerden fatura oluşturulabilir." });
                }

                // Bu siparişe ait fatura var mı kontrol et
                var existingInvoice = await _context.Invoices
                    .FirstOrDefaultAsync(i => i.OrderId == orderId);

                if (existingInvoice != null)
                {
                    return BadRequest(new { message = "Bu siparişe ait zaten bir fatura oluşturulmuş." });
                }

                // Yeni fatura oluştur
                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId,
                    CustomerId = order.CustomerId,
                    InvoiceNumber = await GenerateUniqueInvoiceNumber(),
                    Status = "taslak",
                    TotalAmount = order.Items.Sum(i => i.TotalPrice),
                    IssuedAt = DateTimeOffset.UtcNow,
                    InvoiceDate = DateTimeOffset.UtcNow,
                    DueDate = DateTimeOffset.UtcNow.AddDays(30),
                    Items = new List<InvoiceItem>()
                };

                // Sipariş kalemlerini fatura kalemlerine kopyala
                foreach (var orderItem in order.Items)
                {
                    var invoiceItem = new InvoiceItem
                    {
                        Id = Guid.NewGuid(),
                        InvoiceId = invoice.Id,
                        ProductId = orderItem.ProductId,
                        Quantity = orderItem.Quantity,
                        UnitPrice = orderItem.UnitPrice,
                        TotalPrice = orderItem.TotalPrice
                    };
                    invoice.Items.Add(invoiceItem);
                }

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Fatura başarıyla oluşturuldu.",
                    invoiceId = invoice.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Fatura oluşturulurken hata: {ex.Message}" });
            }
        }

        // POST: api/invoice/reject/{id} - Faturayı reddet/sil
        [HttpPost("reject/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> RejectInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            if (invoice.Status != "taslak")
            {
                return BadRequest("Sadece taslak durumundaki faturalar reddedilebilir.");
            }

            // Fatura öğelerini sil
            _context.InvoiceItems.RemoveRange(invoice.Items);
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Fatura başarıyla silindi." });
        }

        // GET: api/invoice/ai-recommendations/{id} - AI önerileri al
        [HttpGet("ai-recommendations/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAIRecommendationsForInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                .ThenInclude(o => o.Customer)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null) return NotFound();

            var recommendations = await GetAIRecommendations(invoice);
            return Ok(recommendations);
        }

        // AI önerileri alma metodu
        private async Task<List<string>> GetAIRecommendations(Invoice invoice)
        {
            var recommendations = new List<string>();

            // 1. Stok kontrolü
            foreach (var item in invoice.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null && product.StockQuantity < item.Quantity)
                {
                    recommendations.Add($"⚠️ {product.Name} ürünü için stok yetersiz! Mevcut: {product.StockQuantity}, Gereken: {item.Quantity}");
                }
            }

            // 2. Müşteri ödeme geçmişi kontrolü
            if (invoice.Order?.Customer != null)
            {
                var customerId = invoice.Order.Customer.Id;
                var overdueInvoices = await _context.Invoices
                    .Where(i => i.Order.Customer.Id == customerId && 
                               i.Status == "Ödenmedi" && 
                               i.DueDate < DateTimeOffset.UtcNow)
                    .CountAsync();

                if (overdueInvoices > 0)
                {
                    recommendations.Add($"Bu müşterinin {overdueInvoices} adet gecikmiş ödemesi var. Dikkatli olun!");
                }

                // Müşteri tipine göre öneri
                if (invoice.Order.Customer.Type == "kurumsal")
                {
                    recommendations.Add("Kurumsal müşteri - Vadeli ödeme uygun olabilir.");
                }
            }

            // 3. Sipariş tutarına göre öneri
            if (invoice.TotalAmount > 10000)
            {
                recommendations.Add("Yüksek tutarlı sipariş - Detaylı inceleme önerilir.");
            }
            else if (invoice.TotalAmount < 1000)
            {
                recommendations.Add("Düşük tutarlı sipariş - Hızlı onay uygun.");
            }

            // 4. Ürün çeşitliliği kontrolü
            var uniqueProducts = invoice.Items.Select(i => i.ProductId).Distinct().Count();
            if (uniqueProducts > 5)
            {
                recommendations.Add("Çok çeşitli ürünler - Paketleme ve gönderim süresi uzayabilir.");
            }

            // 5. Mevsimsel öneriler (basit örnek)
            var currentMonth = DateTime.Now.Month;
            if (currentMonth == 12 || currentMonth == 1)
            {
                recommendations.Add("Yılbaşı dönemi - Teslimat süreleri uzayabilir.");
            }

            return recommendations;
        }

        // GET: api/invoice/draft - Taslak faturaları getir
        [HttpGet("draft")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<InvoiceReadDto>>> GetDraftInvoices()
        {
            var invoices = await _context.Invoices
                .Include(i => i.Items)
                    .ThenInclude(ii => ii.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o.Customer)
                .Where(i => i.Status == "taslak")
                .OrderByDescending(i => i.IssuedAt)
                .ToListAsync();

            var result = invoices.Select(invoice =>
            {
                var dto = _mapper.Map<InvoiceReadDto>(invoice);
                dto.Items = invoice.Items.Select(ii => _mapper.Map<InvoiceItemReadDto>(ii)).ToList();
                return dto;
            }).ToList();

            return Ok(result);
        }

        // Benzersiz fatura numarası oluştur
        private async Task<string> GenerateUniqueInvoiceNumber()
        {
            var random = new Random();
            string invoiceNumber;
            bool isUnique;

            do
            {
                invoiceNumber = $"INV-{DateTime.Now.Year}{DateTime.Now.Month:D2}{DateTime.Now.Day:D2}-{random.Next(1000, 9999)}";
                isUnique = !await _context.Invoices.AnyAsync(i => i.InvoiceNumber == invoiceNumber);
            } while (!isUnique);

            return invoiceNumber;
        }
    }
}
