using AkilliMikroERP.Data;
using AkilliMikroERP.Dtos;
using AkilliMikroERP.Models;
using AkilliMikroERP.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly JwtService _jwtService;

        public AuthController(ApplicationDbContext context, JwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }
        
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
        {
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                    return BadRequest(new { message = "Email zaten kayıtlı." });

                var user = new User
                {
                    Email = dto.Email,
                    Name = dto.Name,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                    RoleId = 2
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Kayıt başarılı." });
            }
            catch (Exception ex)
            {
                // Hatanın detaylarını logla
                Console.WriteLine("Register Error: " + ex.ToString());
                return StatusCode(500, new { message = "Sunucu hatası", details = ex.Message });
            }
        }
 
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserDto dto)
        {
            try
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == dto.Email);
                if (user == null)
                    return Unauthorized("Kullanıcı bulunamadı.");

                if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                    return Unauthorized("Şifre yanlış.");

                var token = _jwtService.GenerateToken(user.Id, user.Role?.Name ?? "user");

                return Ok(new { 
                    token,
                    user = new {
                        id = user.Id,
                        name = user.Name,
                        email = user.Email,
                        role = user.Role?.Name ?? "user"
                    }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login Error: " + ex.ToString());  // Hata konsola yazılır
                return StatusCode(500, new { message = ex.Message, stackTrace = ex.StackTrace });  // Postman'de hata detayları döner
            }
        }


    }
}
