using System;
using System.ComponentModel.DataAnnotations;

namespace AkilliMikroERP.Dtos
{
    public class PaymentUpdateDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Ödeme tutarı gereklidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Ödeme tutarı 0'dan büyük olmalıdır")]
        public decimal Amount { get; set; }

        public DateTime? PaymentDate { get; set; }

        [Required(ErrorMessage = "Ödeme yöntemi gereklidir")]
        public string Method { get; set; } = "nakit";
    }

    public class PaymentReadDto
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? CustomerName { get; set; }
        public decimal Amount { get; set; }
        public DateTime? PaymentDate { get; set; }
        public string Method { get; set; } = string.Empty;
    }

    public class PaymentSummaryDto
    {
        public Guid InvoiceId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public int PaymentCount { get; set; }
        public bool IsFullyPaid { get; set; }
    }
    // DTOs/PaymentDto.cs
    public class PaymentCreateDto
    {
        public Guid InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public DateTimeOffset? PaymentDate { get; set; }
        public string Method { get; set; } = "nakit";
    }
}