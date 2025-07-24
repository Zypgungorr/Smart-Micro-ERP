namespace AkilliMikroERP.Dtos
{
    // Sipariş oluşturmak için
    public class OrderCreateDto
    {
        public Guid CustomerId { get; set; }
        public Guid CreatedBy { get; set; }
        public List<OrderItemCreateDto> Items { get; set; } = new();
    }

    public class OrderItemCreateDto
    {
        public Guid ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    // Sipariş güncellemek için
    public class OrderUpdateDto
    {
        public string Status { get; set; } = "hazırlanıyor";
        public string PaymentStatus { get; set; } = "bekliyor";
        public DateTimeOffset? DeliveryDate { get; set; }
        public decimal TotalAmount { get; set; } // Toplam tutar eklendi
        public List<OrderItemCreateDto> Items { get; set; } = new();
    }

    // Sipariş okuma için
    public class OrderItemReadDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class OrderReadDto
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? Status { get; set; }
        public string? PaymentStatus { get; set; }
        public DateTimeOffset OrderDate { get; set; }
        public DateTimeOffset? DeliveryDate { get; set; }
        public List<OrderItemReadDto> Items { get; set; } = new();
        public decimal TotalAmount { get; set; } // EKLENDİ: Toplam tutar
    }
}
