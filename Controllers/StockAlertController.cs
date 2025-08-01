using Microsoft.AspNetCore.Mvc;
using AkilliMikroERP.Services;
using Microsoft.AspNetCore.Authorization;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockAlertController : ControllerBase
    {
        private readonly StockAlertService _stockAlertService;

        public StockAlertController(StockAlertService stockAlertService)
        {
            _stockAlertService = stockAlertService;
        }

        // GET: api/stockalert
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetStockAlerts()
        {
            try
            {
                var alerts = await _stockAlertService.GetStockAlerts();
                return Ok(alerts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Stok uyarıları alınırken hata oluştu.", details = ex.Message });
            }
        }

        // GET: api/stockalert/summary
        [HttpGet("summary")]
        [AllowAnonymous]
        public async Task<IActionResult> GetStockSummary()
        {
            try
            {
                var summary = await _stockAlertService.GetStockSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Stok özeti alınırken hata oluştu.", details = ex.Message });
            }
        }

        // GET: api/stockalert/critical
        [HttpGet("critical")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCriticalAlerts()
        {
            try
            {
                var allAlerts = await _stockAlertService.GetStockAlerts();
                var criticalAlerts = allAlerts.Where(a => a.Severity >= StockAlertSeverity.High).ToList();
                return Ok(criticalAlerts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Kritik uyarılar alınırken hata oluştu.", details = ex.Message });
            }
        }
    }
} 