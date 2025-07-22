
using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string OrderNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public string Status { get; set; } = "hazırlanıyor";
    public string PaymentStatus { get; set; } = "bekliyor";


    public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeliveryDate { get; set; }

    public Guid CreatedBy { get; set; }
    public User? Creator { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem>? Items { get; set; }
    public Invoice? Invoice { get; set; }
}
}
