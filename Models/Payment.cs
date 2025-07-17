using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }

    public decimal Amount { get; set; }
    public DateTimeOffset? PaymentDate { get; set; }
    public string Method { get; set; } = "nakit";
}
}
