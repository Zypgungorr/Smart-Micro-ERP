namespace AkilliMikroERP.Dtos
{
    public class ProductCreateDto
    {
        public string? Name { get; set; }
        public string? Sku { get; set; }
        public int CategoryId { get; set; }
        public decimal PriceSale { get; set; }
        public decimal? PricePurchase { get; set; }
        public decimal StockQuantity { get; set; }
        public decimal StockCritical { get; set; }
        public string? Unit { get; set; }
        public string? Description { get; set; }
        public string? AiDescription { get; set; }
        public string? PhotoUrl { get; set; }
    }

    public class ProductUpdateDto : ProductCreateDto
    {
        public Guid Id { get; set; }
    }
        public class ProductDto
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public CategoryDto? Category { get; set; }
    }
}
