
using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class AiLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string? Model { get; set; }
        public string? Type { get; set; } // Örnek: "product_description"
        public Guid? RelatedId { get; set; }

        public string? InputData { get; set; } // JSON string
        public string? OutputData { get; set; } // JSON string
        public string Status { get; set; } = "başarılı";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}