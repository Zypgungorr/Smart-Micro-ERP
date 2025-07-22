using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
public class Customer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Type { get; set; } = "bireysel"; // veya kurumsal
    public string? Segment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Order>? Orders { get; set; }
}
}
