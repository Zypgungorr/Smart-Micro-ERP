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

        public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? DueDate { get; set; }

        public string Status { get; set; } = "ödenmedi";

        public DateTimeOffset InvoiceDate { get; set; } = DateTimeOffset.UtcNow;

        public ICollection<InvoiceItem>? Items { get; set; } = new List<InvoiceItem>();
        public ICollection<Payment>? Payments { get; set; } = new List<Payment>();
    }
}
