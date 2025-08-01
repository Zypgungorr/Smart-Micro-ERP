using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace AkilliMikroERP.Services
{
    public class StockAlertService
    {
        private readonly ApplicationDbContext _context;
        private readonly GeminiService _geminiService;

        public StockAlertService(ApplicationDbContext context, GeminiService geminiService)
        {
            _context = context;
            _geminiService = geminiService;
        }

        public async Task<List<StockAlert>> GetStockAlerts()
        {
            var alerts = new List<StockAlert>();
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.OrderItems)
                .ToListAsync();

            foreach (var product in products)
            {
                var alert = await AnalyzeProductStock(product);
                if (alert != null)
                {
                    alerts.Add(alert);
                }
            }

            return alerts.OrderByDescending(a => a.Severity).ToList();
        }

        private async Task<StockAlert?> AnalyzeProductStock(Product product)
        {
            // Kritik stok kontrolü
            if (product.StockQuantity <= product.StockCritical)
            {
                return new StockAlert
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Category = product.Category?.Name ?? "Bilinmeyen",
                    CurrentStock = product.StockQuantity,
                    CriticalLevel = product.StockCritical,
                    AlertType = StockAlertType.Critical,
                    Severity = StockAlertSeverity.High,
                    Message = $"Kritik stok seviyesi! {product.Name} için sadece {product.StockQuantity} adet kaldı.",
                    RecommendedAction = "Acil sipariş verin",
                    EstimatedStockOutDays = await CalculateStockOutDays(product),
                    RecommendedOrderQuantity = await CalculateRecommendedOrderQuantity(product),
                    CreatedAt = DateTime.UtcNow
                };
            }

            // Düşük stok kontrolü (kritik seviyenin 2 katı)
            if (product.StockQuantity <= product.StockCritical * 2)
            {
                var estimatedDays = await CalculateStockOutDays(product);
                
                if (estimatedDays <= 14) // 2 hafta içinde bitecek
                {
                    return new StockAlert
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Category = product.Category?.Name ?? "Bilinmeyen",
                        CurrentStock = product.StockQuantity,
                        CriticalLevel = product.StockCritical,
                        AlertType = StockAlertType.Low,
                        Severity = StockAlertSeverity.Medium,
                        Message = $"Düşük stok uyarısı! {product.Name} için {product.StockQuantity} adet kaldı. Tahmini {estimatedDays} gün içinde bitecek.",
                        RecommendedAction = "Sipariş planlayın",
                        EstimatedStockOutDays = estimatedDays,
                        RecommendedOrderQuantity = await CalculateRecommendedOrderQuantity(product),
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }

            // Sezonsal stok kontrolü
            var seasonalAlert = await CheckSeasonalStock(product);
            if (seasonalAlert != null)
            {
                return seasonalAlert;
            }

            return null;
        }

        private async Task<int> CalculateStockOutDays(Product product)
        {
            try
            {
                // Son 30 günlük satış verilerini al
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var recentSales = await _context.OrderItems
                    .Where(oi => oi.ProductId == product.Id && oi.Order.OrderDate >= thirtyDaysAgo)
                    .SumAsync(oi => oi.Quantity);

                var dailySales = recentSales / 30.0m;
                
                if (dailySales > 0)
                {
                    return (int)(product.StockQuantity / dailySales);
                }

                // AI ile tahmin et
                return await _geminiService.GetEstimatedStockOutDays(
                    product.Name,
                    product.Category?.Name ?? "Genel",
                    (int)product.StockQuantity
                );
            }
            catch
            {
                return 90; // Varsayılan değer
            }
        }

        private async Task<int> CalculateRecommendedOrderQuantity(Product product)
        {
            try
            {
                // Son 30 günlük satış verilerini al
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                var recentSales = await _context.OrderItems
                    .Where(oi => oi.ProductId == product.Id && oi.Order.OrderDate >= thirtyDaysAgo)
                    .SumAsync(oi => oi.Quantity);

                var monthlySales = recentSales;
                var recommendedQuantity = (int)(monthlySales * 1.5m); // 1.5 aylık stok

                // Minimum sipariş miktarı
                if (recommendedQuantity < 10)
                {
                    recommendedQuantity = 10;
                }

                // Maksimum sipariş miktarı
                if (recommendedQuantity > 1000)
                {
                    recommendedQuantity = 1000;
                }

                return recommendedQuantity;
            }
            catch
            {
                return 50; // Varsayılan değer
            }
        }

        private async Task<StockAlert?> CheckSeasonalStock(Product product)
        {
            try
            {
                var currentMonth = DateTime.UtcNow.Month;
                var category = product.Category?.Name?.ToLower() ?? "";

                // Sezonsal ürün kontrolü
                var isSeasonalProduct = IsSeasonalProduct(category, currentMonth);
                
                if (isSeasonalProduct && product.StockQuantity < 50)
                {
                    return new StockAlert
                    {
                        ProductId = product.Id,
                        ProductName = product.Name,
                        Category = product.Category?.Name ?? "Bilinmeyen",
                        CurrentStock = product.StockQuantity,
                        CriticalLevel = product.StockCritical,
                        AlertType = StockAlertType.Seasonal,
                        Severity = StockAlertSeverity.Medium,
                        Message = $"Sezonsal stok uyarısı! {product.Name} için sezon yaklaşıyor, stok artırın.",
                        RecommendedAction = "Sezonsal sipariş verin",
                        EstimatedStockOutDays = await CalculateStockOutDays(product),
                        RecommendedOrderQuantity = await CalculateRecommendedOrderQuantity(product),
                        CreatedAt = DateTime.UtcNow
                    };
                }
            }
            catch
            {
                // Hata durumunda null döndür
            }

            return null;
        }

        private bool IsSeasonalProduct(string category, int month)
        {
            return category switch
            {
                "giyim" => month >= 3 && month <= 5 || month >= 9 && month <= 11, // İlkbahar/Sonbahar
                "spor" => month >= 5 && month <= 9, // Yaz
                "ev & yaşam" => month >= 11 || month <= 2, // Kış
                _ => false
            };
        }

        public async Task<StockSummary> GetStockSummary()
        {
            var products = await _context.Products.ToListAsync();
            
            return new StockSummary
            {
                TotalProducts = products.Count,
                CriticalStockCount = products.Count(p => p.StockQuantity <= p.StockCritical),
                LowStockCount = products.Count(p => p.StockQuantity <= p.StockCritical * 2 && p.StockQuantity > p.StockCritical),
                OutOfStockCount = products.Count(p => p.StockQuantity == 0),
                TotalStockValue = products.Sum(p => p.StockQuantity * p.PriceSale),
                AverageStockLevel = (double)products.Average(p => p.StockQuantity),
                LastUpdated = DateTime.UtcNow
            };
        }
    }

    public class StockAlert
    {
        public Guid ProductId { get; set; }
        public string ProductName { get; set; } = "";
        public string Category { get; set; } = "";
        public decimal CurrentStock { get; set; }
        public decimal CriticalLevel { get; set; }
        public StockAlertType AlertType { get; set; }
        public StockAlertSeverity Severity { get; set; }
        public string Message { get; set; } = "";
        public string RecommendedAction { get; set; } = "";
        public int EstimatedStockOutDays { get; set; }
        public int RecommendedOrderQuantity { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class StockSummary
    {
        public int TotalProducts { get; set; }
        public int CriticalStockCount { get; set; }
        public int LowStockCount { get; set; }
        public int OutOfStockCount { get; set; }
        public decimal TotalStockValue { get; set; }
        public double AverageStockLevel { get; set; }
        public DateTime LastUpdated { get; set; }
    }

    public enum StockAlertType
    {
        Critical,
        Low,
        Seasonal,
        OutOfStock
    }

    public enum StockAlertSeverity
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }
} 