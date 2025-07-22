using Microsoft.AspNetCore.Mvc;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
public class SettingController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SettingController(ApplicationDbContext context)
    {
        _context = context;
    }

    // Tüm ayarları getir
    [AllowAnonymous]
    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(_context.Settings.ToList());
    }

    // Belirli bir ayarı getir
    [AllowAnonymous]
    [HttpGet("{key}")]
    public IActionResult Get(string key)
    {
        var setting = _context.Settings.FirstOrDefault(s => s.Key == key);
        return setting == null ? NotFound() : Ok(setting);
    }

    // Yeni ayar ekle
    [AllowAnonymous]
    [HttpPost]
    public IActionResult Create([FromBody] Setting setting)
    {
        if (string.IsNullOrWhiteSpace(setting.Key))
            return BadRequest(new { Key = "Ayar anahtarı boş olamaz" });

        if (_context.Settings.Any(s => s.Key == setting.Key))
            return Conflict(new { Key = "Bu anahtarla bir ayar zaten mevcut" });

        setting.UpdatedAt = DateTime.UtcNow;
        _context.Settings.Add(setting);
        _context.SaveChanges();
        return CreatedAtAction(nameof(Get), new { key = setting.Key }, setting);
    }

    // Var olan ayarı güncelle
    [AllowAnonymous]
    [HttpPut("{key}")]
    public IActionResult Update(string key, [FromBody] Setting updated)
    {
        var setting = _context.Settings.FirstOrDefault(s => s.Key == key);
        if (setting == null) return NotFound();

        setting.Value = updated.Value;
        setting.UpdatedAt = DateTime.UtcNow;
        _context.SaveChanges();
        return NoContent();
    }

    // Ayarı sil (isteğe bağlı)
    [AllowAnonymous]
    [HttpDelete("{key}")]
    public IActionResult Delete(string key)
    {
        var setting = _context.Settings.FirstOrDefault(s => s.Key == key);
        if (setting == null) return NotFound();

        _context.Settings.Remove(setting);
        _context.SaveChanges();
        return NoContent();
    }
}
