using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class Product
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string? Name { get; set; }
        public string? Sku { get; set; }
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        public decimal PriceSale { get; set; }
        public decimal? PricePurchase { get; set; }
        public decimal StockQuantity { get; set; } = 0;
        public decimal StockCritical { get; set; } = 10;
        public string Unit { get; set; } = "adet";
        public string? Description { get; set; }
        public string? AiDescription { get; set; }
        public string? SeoTags { get; set; }
        public string? PhotoUrl { get; set; }
        public Guid CreatedBy { get; set; }
        public User? Creator { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<OrderItem>? OrderItems { get; set; }
    }
}
