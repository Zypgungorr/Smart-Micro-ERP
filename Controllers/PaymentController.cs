using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;
using Microsoft.AspNetCore.Authorization;

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
    [AllowAnonymous]
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
    [AllowAnonymous]
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
    [AllowAnonymous]
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
    [AllowAnonymous]
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
    [AllowAnonymous]
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
        invoice.Status = newTotalPaid >= invoice.TotalAmount ? "Ödendi" :
                         newTotalPaid > 0 ? "Kısmi Ödendi" : "Ödenmedi";

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
    [AllowAnonymous]
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
        payment.Invoice.Status = newTotal >= payment.Invoice.TotalAmount ? "Ödendi" :
                                 newTotal > 0 ? "Kısmi Ödendi" : "Ödenmedi";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/payment/{id}
    [HttpDelete("{id}")]
    [AllowAnonymous]
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

        payment.Invoice.Status = remaining >= payment.Invoice.TotalAmount ? "Ödendi" :
                                 remaining > 0 ? "Kısmi Ödendi" : "Ödenmedi";

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
