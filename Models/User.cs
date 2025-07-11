using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public int RoleId { get; set; } = 2; // Default user role id
        public Role? Role { get; set; }
        public string Status { get; set; } = "active";
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Order>? Orders { get; set; }
        public ICollection<Product>? CreatedProducts { get; set; }
    }
}
