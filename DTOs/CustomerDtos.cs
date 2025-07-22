using System;
using System.ComponentModel.DataAnnotations;

namespace AkilliMikroERP.Dtos
{
    // public class CustomerCreateDto
    // {
    //     [Required(ErrorMessage = "Müşteri adı gereklidir")]
    //     [StringLength(100, ErrorMessage = "Müşteri adı en fazla 100 karakter olabilir")]
    //     public string Name { get; set; } = string.Empty;

    //     [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
    //     [StringLength(100, ErrorMessage = "Email en fazla 100 karakter olabilir")]
    //     public string? Email { get; set; }

    //     [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
    //     [StringLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir")]
    //     public string? Phone { get; set; }

    //     [StringLength(500, ErrorMessage = "Adres en fazla 500 karakter olabilir")]
    //     public string? Address { get; set; }

    //     [StringLength(20, ErrorMessage = "Tip en fazla 20 karakter olabilir")]
    //     public string? Type { get; set; } = "bireysel"; // bireysel, kurumsal

    //     [StringLength(50, ErrorMessage = "Segment en fazla 50 karakter olabilir")]
    //     public string? Segment { get; set; }
    // }

    public class CustomerUpdateDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required(ErrorMessage = "Müşteri adı gereklidir")]
        [StringLength(100, ErrorMessage = "Müşteri adı en fazla 100 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        [StringLength(100, ErrorMessage = "Email en fazla 100 karakter olabilir")]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
        [StringLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir")]
        public string? Phone { get; set; }

        [StringLength(500, ErrorMessage = "Adres en fazla 500 karakter olabilir")]
        public string? Address { get; set; }

        [StringLength(20, ErrorMessage = "Tip en fazla 20 karakter olabilir")]
        public string? Type { get; set; } = "bireysel"; // bireysel, kurumsal

        [StringLength(50, ErrorMessage = "Segment en fazla 50 karakter olabilir")]
        public string? Segment { get; set; }
    }

    public class CustomerDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Type { get; set; }
        public string? Segment { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CustomerListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Type { get; set; }
        public string? Segment { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class CustomerReadDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Type { get; set; }
        public string? Segment { get; set; }
        public DateTime CreatedAt { get; set; }
        public int OrderCount { get; set; }
    }

    public class CustomerDetailDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Type { get; set; }
        public string? Segment { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalOrderAmount { get; set; }
        public DateTimeOffset? LastOrderDate { get; set; }
        public List<CustomerOrderSummaryDto> RecentOrders { get; set; } = new();
    }

    public class CustomerOrderSummaryDto
    {
        public Guid Id { get; set; }
        public DateTimeOffset OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int ItemCount { get; set; }
    }

    public class CustomerStatsDto
    {
        public int TotalCustomers { get; set; }
        public int ActiveCustomers { get; set; }
        public int InactiveCustomers { get; set; }
        public Dictionary<string, int> CustomersByType { get; set; } = new();
        public Dictionary<string, int> CustomersBySegment { get; set; } = new();
    }
    public class CustomerCreateDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Type { get; set; } = "bireysel";
    public string? Segment { get; set; }
}
}