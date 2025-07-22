using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Dtos
{
    public class InvoiceCreateDto
    {
        public Guid OrderId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTimeOffset IssuedAt { get; set; }
        public DateTimeOffset DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<InvoiceItemCreateDto> Items { get; set; } = new();
    }


    public class InvoiceItemCreateDto
    {
        public Guid ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class InvoiceItemReadDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    // public class InvoiceReadDto
    // {
    //     public Guid Id { get; set; }
    //     public Guid OrderId { get; set; }
    //     public DateTimeOffset InvoiceDate { get; set; }
    //     public decimal TotalAmount { get; set; }
    //     public List<InvoiceItemReadDto> Items { get; set; } = new();
    // }
    
    public class InvoiceReadDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset IssuedAt { get; set; }
    public DateTimeOffset? DueDate { get; set; }
    public DateTimeOffset InvoiceDate { get; set; }
    public decimal TotalAmount { get; set; }
    public List<InvoiceItemReadDto> Items { get; set; } = new();
}

}
