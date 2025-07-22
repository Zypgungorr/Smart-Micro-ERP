using System;

namespace AkilliMikroERP.Models
{
    public class InvoiceItem
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public Guid ProductId { get; set; }

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        public Invoice? Invoice { get; set; }
        public Product? Product { get; set; }
    }
}
