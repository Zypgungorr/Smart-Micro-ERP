using System;
using System.ComponentModel.DataAnnotations;
using AkilliMikroERP.Dtos; // OrderReadDto kullanımı için

namespace AkilliMikroERP.Dtos
{
    public class CustomerCreateDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Type { get; set; } = "bireysel";
    public string? Segment { get; set; }
}

    public class CustomerDetailWithOrdersDto
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? Type { get; set; }
        public string? Segment { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<OrderReadDto> Orders { get; set; } = new();
    }
}