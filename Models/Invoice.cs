using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public string? InvoiceNumber { get; set; }
    public decimal TotalAmount { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }

    public string Status { get; set; } = "ödenmedi";

    public ICollection<Payment>? Payments { get; set; }
}
}
