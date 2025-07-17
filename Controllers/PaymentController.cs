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
//     public class PaymentController : ControllerBase
//     {
//         private readonly ApplicationDbContext _context;
//         private readonly IMapper _mapper;
//         private readonly ILogger<PaymentController> _logger;

//         public PaymentController(ApplicationDbContext context, IMapper mapper, ILogger<PaymentController> logger)
//         {
//             _context = context;
//             _mapper = mapper;
//             _logger = logger;
//         }

//         // GET: api/payment
//         [HttpGet]
//         public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetAllPayments()
//         {
//             try
//             {
//                 var payments = await _context.Payments
//                     .Include(p => p.Invoice)
//                         .ThenInclude(i => i.Order)
//                             .ThenInclude(o => o.Customer)
//                     .ToListAsync();

//                 var paymentDtos = payments.Select(p => new PaymentReadDto
//                 {
//                     Id = p.Id,
//                     InvoiceId = p.InvoiceId,
//                     InvoiceNumber = p.Invoice?.InvoiceNumber,
//                     CustomerName = p.Invoice?.Order?.Customer?.Name,
//                     Amount = p.Amount,
//                     PaymentDate = p.PaymentDate,
//                     Method = p.Method
//                 }).ToList();

//                 return Ok(paymentDtos);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Ödemeler getirilirken hata oluştu");
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // GET: api/payment/{id}
//         [HttpGet("{id}")]
//         public async Task<ActionResult<PaymentReadDto>> GetPaymentById(Guid id)
//         {
//             try
//             {
//                 var payment = await _context.Payments
//                     .Include(p => p.Invoice)
//                         .ThenInclude(i => i.Order)
//                             .ThenInclude(o => o.Customer)
//                     .FirstOrDefaultAsync(p => p.Id == id);

//                 if (payment == null)
//                 {
//                     return NotFound($"ID: {id} olan ödeme bulunamadı.");
//                 }

//                 var paymentDto = new PaymentReadDto
//                 {
//                     Id = payment.Id,
//                     InvoiceId = payment.InvoiceId,
//                     InvoiceNumber = payment.Invoice?.InvoiceNumber,
//                     CustomerName = payment.Invoice?.Order?.Customer?.Name,
//                     Amount = payment.Amount,
//                     PaymentDate = payment.PaymentDate,
//                     Method = payment.Method
//                 };

//                 return Ok(paymentDto);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Ödeme {PaymentId} getirilirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // GET: api/payment/invoice/{invoiceId}
//         [HttpGet("invoice/{invoiceId}")]
//         public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetPaymentsByInvoiceId(Guid invoiceId)
//         {
//             try
//             {
//                 var payments = await _context.Payments
//                     .Include(p => p.Invoice)
//                         .ThenInclude(i => i.Order)
//                             .ThenInclude(o => o.Customer)
//                     .Where(p => p.InvoiceId == invoiceId)
//                     .ToListAsync();

//                 var paymentDtos = payments.Select(p => new PaymentReadDto
//                 {
//                     Id = p.Id,
//                     InvoiceId = p.InvoiceId,
//                     InvoiceNumber = p.Invoice?.InvoiceNumber,
//                     CustomerName = p.Invoice?.Order?.Customer?.Name,
//                     Amount = p.Amount,
//                     PaymentDate = p.PaymentDate,
//                     Method = p.Method
//                 }).ToList();

//                 return Ok(paymentDtos);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Fatura {InvoiceId} için ödemeler getirilirken hata oluştu", invoiceId);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // POST: api/payment
//         [HttpPost]
//         public async Task<ActionResult<PaymentReadDto>> CreatePayment(PaymentCreateDto dto)
//         {
//             try
//             {
//                 // Fatura var mı kontrol et
//                 var invoice = await _context.Invoices
//                     .Include(i => i.Payments)
//                     .Include(i => i.Order)
//                         .ThenInclude(o => o.Customer)
//                     .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId);

//                 if (invoice == null)
//                 {
//                     return BadRequest($"ID: {dto.InvoiceId} olan fatura bulunamadı.");
//                 }

//                 // Toplam ödenen miktarı kontrol et
//                 var totalPaidAmount = invoice.Payments?.Sum(p => p.Amount) ?? 0;
//                 var remainingAmount = invoice.TotalAmount - totalPaidAmount;

//                 if (dto.Amount > remainingAmount)
//                 {
//                     return BadRequest($"Ödeme tutarı kalan borcu ({remainingAmount:C}) aşamaz.");
//                 }

//                 if (dto.Amount <= 0)
//                 {
//                     return BadRequest("Ödeme tutarı 0'dan büyük olmalıdır.");
//                 }

//                 var payment = new Payment
//                 {
//                     Id = Guid.NewGuid(),
//                     InvoiceId = dto.InvoiceId,
//                     Amount = dto.Amount,
//                     PaymentDate = dto.PaymentDate ?? DateTime.UtcNow,
//                     Method = dto.Method ?? "nakit"
//                 };

//                 _context.Payments.Add(payment);

//                 // Fatura durumunu güncelle
//                 var newTotalPaid = totalPaidAmount + dto.Amount;
//                 if (newTotalPaid >= invoice.TotalAmount)
//                 {
//                     invoice.Status = "ödendi";
//                 }
//                 else
//                 {
//                     invoice.Status = "kısmi_ödendi";
//                 }

//                 await _context.SaveChangesAsync();

//                 var paymentDto = new PaymentReadDto
//                 {
//                     Id = payment.Id,
//                     InvoiceId = payment.InvoiceId,
//                     InvoiceNumber = invoice.InvoiceNumber,
//                     CustomerName = invoice.Order?.Customer?.Name,
//                     Amount = payment.Amount,
//                     PaymentDate = payment.PaymentDate,
//                     Method = payment.Method
//                 };

//                 _logger.LogInformation("Yeni ödeme oluşturuldu: {PaymentId}, Tutar: {Amount}", payment.Id, payment.Amount);

//                 return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, paymentDto);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Ödeme oluşturulurken hata oluştu");
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // PUT: api/payment/{id}
//         [HttpPut("{id}")]
//         public async Task<IActionResult> UpdatePayment(Guid id, PaymentUpdateDto dto)
//         {
//             try
//             {
//                 if (id != dto.Id)
//                 {
//                     return BadRequest("ID uyuşmazlığı.");
//                 }

//                 var payment = await _context.Payments
//                     .Include(p => p.Invoice)
//                         .ThenInclude(i => i.Payments)
//                     .FirstOrDefaultAsync(p => p.Id == id);

//                 if (payment == null)
//                 {
//                     return NotFound($"ID: {id} olan ödeme bulunamadı.");
//                 }

//                 // Diğer ödemelerin toplamını hesapla (bu ödeme hariç)
//                 var otherPaymentsTotal = payment.Invoice.Payments
//                     .Where(p => p.Id != id)
//                     .Sum(p => p.Amount);

//                 var remainingAmount = payment.Invoice.TotalAmount - otherPaymentsTotal;

//                 if (dto.Amount > remainingAmount)
//                 {
//                     return BadRequest($"Ödeme tutarı kalan borcu ({remainingAmount:C}) aşamaz.");
//                 }

//                 if (dto.Amount <= 0)
//                 {
//                     return BadRequest("Ödeme tutarı 0'dan büyük olmalıdır.");
//                 }

//                 // Ödeme bilgilerini güncelle
//                 payment.Amount = dto.Amount;
//                 payment.PaymentDate = dto.PaymentDate ?? payment.PaymentDate;
//                 payment.Method = dto.Method ?? payment.Method;

//                 // Fatura durumunu güncelle
//                 var newTotalPaid = otherPaymentsTotal + dto.Amount;
//                 if (newTotalPaid >= payment.Invoice.TotalAmount)
//                 {
//                     payment.Invoice.Status = "ödendi";
//                 }
//                 else if (newTotalPaid > 0)
//                 {
//                     payment.Invoice.Status = "kısmi_ödendi";
//                 }
//                 else
//                 {
//                     payment.Invoice.Status = "ödenmedi";
//                 }

//                 await _context.SaveChangesAsync();

//                 _logger.LogInformation("Ödeme güncellendi: {PaymentId}, Yeni Tutar: {Amount}", payment.Id, payment.Amount);

//                 return NoContent();
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Ödeme {PaymentId} güncellenirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // DELETE: api/payment/{id}
//         [HttpDelete("{id}")]
//         public async Task<IActionResult> DeletePayment(Guid id)
//         {
//             try
//             {
//                 var payment = await _context.Payments
//                     .Include(p => p.Invoice)
//                         .ThenInclude(i => i.Payments)
//                     .FirstOrDefaultAsync(p => p.Id == id);

//                 if (payment == null)
//                 {
//                     return NotFound($"ID: {id} olan ödeme bulunamadı.");
//                 }

//                 _context.Payments.Remove(payment);

//                 // Fatura durumunu güncelle
//                 var remainingPayments = payment.Invoice.Payments.Where(p => p.Id != id).Sum(p => p.Amount);
//                 if (remainingPayments >= payment.Invoice.TotalAmount)
//                 {
//                     payment.Invoice.Status = "ödendi";
//                 }
//                 else if (remainingPayments > 0)
//                 {
//                     payment.Invoice.Status = "kısmi_ödendi";
//                 }
//                 else
//                 {
//                     payment.Invoice.Status = "ödenmedi";
//                 }

//                 await _context.SaveChangesAsync();

//                 _logger.LogInformation("Ödeme silindi: {PaymentId}", id);

//                 return NoContent();
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Ödeme {PaymentId} silinirken hata oluştu", id);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }

//         // GET: api/payment/summary/{invoiceId}
//         [HttpGet("summary/{invoiceId}")]
//         public async Task<ActionResult<PaymentSummaryDto>> GetPaymentSummary(Guid invoiceId)
//         {
//             try
//             {
//                 var invoice = await _context.Invoices
//                     .Include(i => i.Payments)
//                     .FirstOrDefaultAsync(i => i.Id == invoiceId);

//                 if (invoice == null)
//                 {
//                     return NotFound($"ID: {invoiceId} olan fatura bulunamadı.");
//                 }

//                 var totalPaid = invoice.Payments?.Sum(p => p.Amount) ?? 0;
//                 var remainingAmount = invoice.TotalAmount - totalPaid;

//                 var summary = new PaymentSummaryDto
//                 {
//                     InvoiceId = invoiceId,
//                     TotalAmount = invoice.TotalAmount,
//                     PaidAmount = totalPaid,
//                     RemainingAmount = remainingAmount,
//                     PaymentCount = invoice.Payments?.Count ?? 0,
//                     IsFullyPaid = remainingAmount <= 0
//                 };

//                 return Ok(summary);
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Fatura {InvoiceId} için ödeme özeti getirilirken hata oluştu", invoiceId);
//                 return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
//             }
//         }
//     }
// }

/////////////////////
///
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using AutoMapper;
// using AkilliMikroERP.Data;
// using AkilliMikroERP.Models;
// using AkilliMikroERP.Dtos;

// [ApiController]
// [Route("api/[controller]")]
// public class PaymentController : ControllerBase
// {
//     private readonly ApplicationDbContext _context;

//     public PaymentController(ApplicationDbContext context)
//     {
//         _context = context;
//     }

//     [HttpGet]
//     public IActionResult GetAll() => Ok(_context.Payments.ToList());

//     [HttpGet("{id}")]
//     public IActionResult Get(Guid id)
//     {
//         var payment = _context.Payments.Find(id);
//         return payment == null ? NotFound() : Ok(payment);
//     }

//     [HttpPost]
//     public IActionResult Create([FromBody] PaymentCreateDto dto)
//     {
//         if (dto.Amount <= 0)
//         {
//             return BadRequest(new { Amount = "Ödeme tutarı 0'dan büyük olmalıdır" });
//         }

//         var invoice = _context.Invoices.Find(dto.InvoiceId);
//         if (invoice == null)
//         {
//             return BadRequest(new { InvoiceId = "Fatura bulunamadı" });
//         }

//         var payment = new Payment
//         {
//             InvoiceId = dto.InvoiceId,
//             Amount = dto.Amount,
//             PaymentDate = (dto.PaymentDate ?? DateTimeOffset.UtcNow).ToUniversalTime(),
//             Method = dto.Method
//         };

//         _context.Payments.Add(payment);
//         _context.SaveChanges();

//         return CreatedAtAction(nameof(Get), new { id = payment.Id }, payment);
//     }

//     [HttpPut("{id}")]
//     public IActionResult Update(Guid id, [FromBody] PaymentCreateDto dto)
//     {
//         var payment = _context.Payments.Find(id);
//         if (payment == null) return NotFound();

//         if (dto.Amount <= 0)
//         {
//             return BadRequest(new { Amount = "Ödeme tutarı 0'dan büyük olmalıdır" });
//         }

//         payment.InvoiceId = dto.InvoiceId;
//         payment.Amount = dto.Amount;
//         payment.PaymentDate = (dto.PaymentDate ?? DateTimeOffset.UtcNow).ToUniversalTime();
//         payment.Method = dto.Method;

//         _context.SaveChanges();
//         return NoContent();
//     }

//     [HttpDelete("{id}")]
//     public IActionResult Delete(Guid id)
//     {
//         var payment = _context.Payments.Find(id);
//         if (payment == null) return NotFound();

//         _context.Payments.Remove(payment);
//         _context.SaveChanges();
//         return NoContent();
//     }
// }


using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PaymentController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/payment
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetAll()
    {
        var payments = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Order)
                    .ThenInclude(o => o.Customer)
            .ToListAsync();

        var result = payments.Select(p => new PaymentReadDto
        {
            Id = p.Id,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice?.InvoiceNumber,
            CustomerName = p.Invoice?.Order?.Customer?.Name,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate?.UtcDateTime,
            Method = p.Method
        });

        return Ok(result);
    }

    // GET: api/payment/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentReadDto>> Get(Guid id)
    {
        var payment = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Order)
                    .ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null) return NotFound();

        var dto = new PaymentReadDto
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            InvoiceNumber = payment.Invoice?.InvoiceNumber,
            CustomerName = payment.Invoice?.Order?.Customer?.Name,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate?.UtcDateTime,
            Method = payment.Method
        };

        return Ok(dto);
    }

    // GET: api/payment/invoice/{invoiceId}
    [HttpGet("invoice/{invoiceId}")]
    public async Task<ActionResult<IEnumerable<PaymentReadDto>>> GetByInvoice(Guid invoiceId)
    {
        var payments = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Order)
                    .ThenInclude(o => o.Customer)
            .Where(p => p.InvoiceId == invoiceId)
            .ToListAsync();

        var result = payments.Select(p => new PaymentReadDto
        {
            Id = p.Id,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice?.InvoiceNumber,
            CustomerName = p.Invoice?.Order?.Customer?.Name,
            Amount = p.Amount,
            PaymentDate = p.PaymentDate?.UtcDateTime,
            Method = p.Method
        });

        return Ok(result);
    }

    // GET: api/payment/summary/{invoiceId}
    [HttpGet("summary/{invoiceId}")]
    public async Task<ActionResult<PaymentSummaryDto>> GetSummary(Guid invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null) return NotFound();

        var totalPaid = invoice.Payments?.Sum(p => p.Amount) ?? 0;
        var remaining = invoice.TotalAmount - totalPaid;

        return Ok(new PaymentSummaryDto
        {
            InvoiceId = invoiceId,
            TotalAmount = invoice.TotalAmount,
            PaidAmount = totalPaid,
            RemainingAmount = remaining,
            PaymentCount = invoice.Payments?.Count ?? 0,
            IsFullyPaid = remaining <= 0
        });
    }

    // POST: api/payment
    [HttpPost]
    public async Task<ActionResult<PaymentReadDto>> Create([FromBody] PaymentCreateDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(new { Amount = "Ödeme tutarı 0'dan büyük olmalıdır." });

        var invoice = await _context.Invoices
            .Include(i => i.Payments)
            .Include(i => i.Order)
                .ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId);

        if (invoice == null)
            return BadRequest(new { InvoiceId = "Fatura bulunamadı." });

        var totalPaid = invoice.Payments?.Sum(p => p.Amount) ?? 0;
        var remaining = invoice.TotalAmount - totalPaid;

        if (dto.Amount > remaining)
            return BadRequest(new { Amount = $"Ödeme tutarı kalan borcu ({remaining:C}) aşamaz." });

        var payment = new Payment
        {
            InvoiceId = dto.InvoiceId,
            Amount = dto.Amount,
            PaymentDate = (dto.PaymentDate ?? DateTimeOffset.UtcNow).ToUniversalTime(),
            Method = dto.Method
        };

        _context.Payments.Add(payment);

        // Fatura durumu güncelle
        var newTotalPaid = totalPaid + dto.Amount;
        invoice.Status = newTotalPaid >= invoice.TotalAmount ? "ödendi" :
                         newTotalPaid > 0 ? "kısmi_ödendi" : "ödenmedi";

        await _context.SaveChangesAsync();

        var readDto = new PaymentReadDto
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            CustomerName = invoice.Order?.Customer?.Name,
            Amount = payment.Amount,
            PaymentDate = payment.PaymentDate?.UtcDateTime,
            Method = payment.Method
        };

        return CreatedAtAction(nameof(Get), new { id = payment.Id }, readDto);
    }

    // PUT: api/payment/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PaymentUpdateDto dto)
    {
        if (id != dto.Id)
            return BadRequest(new { Id = "ID uyuşmazlığı" });

        var payment = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Payments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null)
            return NotFound();

        var otherPayments = payment.Invoice.Payments.Where(p => p.Id != id).Sum(p => p.Amount);
        var remaining = payment.Invoice.TotalAmount - otherPayments;

        if (dto.Amount > remaining)
            return BadRequest(new { Amount = $"Ödeme tutarı kalan borcu ({remaining:C}) aşamaz." });

        payment.Amount = dto.Amount;
        payment.PaymentDate = dto.PaymentDate?.ToUniversalTime() ?? payment.PaymentDate;
        payment.Method = dto.Method;

        var newTotal = otherPayments + dto.Amount;
        payment.Invoice.Status = newTotal >= payment.Invoice.TotalAmount ? "ödendi" :
                                 newTotal > 0 ? "kısmi_ödendi" : "ödenmedi";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/payment/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var payment = await _context.Payments
            .Include(p => p.Invoice)
                .ThenInclude(i => i.Payments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment == null) return NotFound();

        _context.Payments.Remove(payment);

        var remaining = payment.Invoice.Payments
            .Where(p => p.Id != id)
            .Sum(p => p.Amount);

        payment.Invoice.Status = remaining >= payment.Invoice.TotalAmount ? "ödendi" :
                                 remaining > 0 ? "kısmi_ödendi" : "ödenmedi";

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
