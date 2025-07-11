using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;
using AutoMapper;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public OrdersController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // GET: api/orders
        [HttpGet]
        public async Task<ActionResult<List<OrderReadDto>>> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .ToListAsync();

            var orderDtos = _mapper.Map<List<OrderReadDto>>(orders);
            return Ok(orderDtos);
        }

        // GET: api/orders/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderReadDto>> GetOrder(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            var orderDto = _mapper.Map<OrderReadDto>(order);
            return Ok(orderDto);
        }

        // POST: api/orders
        [HttpPost]
        public async Task<ActionResult<OrderReadDto>> CreateOrder(OrderCreateDto orderCreateDto)
        {
            var order = _mapper.Map<Order>(orderCreateDto);
            order.OrderDate = DateTimeOffset.UtcNow;

            if (order.DeliveryDate.HasValue)
                order.DeliveryDate = order.DeliveryDate.Value.ToUniversalTime();

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            foreach (var item in order.Items!)
            {
                item.OrderId = order.Id;
                item.TotalPrice = item.Quantity * item.UnitPrice;
            }

            await _context.SaveChangesAsync();

            var orderReadDto = _mapper.Map<OrderReadDto>(order);
            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, orderReadDto);
        }

        // PUT: api/orders/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(Guid id, OrderUpdateDto orderUpdateDto)
        {
            var existingOrder = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existingOrder == null)
                return NotFound($"Order with id {id} not found.");

            // Önce var olan itemları kaldır (Entity Framework üzerinden)
            _context.OrderItems.RemoveRange(existingOrder.Items);

            // Yeni itemları oluştur ve ekle
            var newItems = orderUpdateDto.Items.Select(itemDto =>
            {
                var orderItem = _mapper.Map<OrderItem>(itemDto);
                orderItem.OrderId = existingOrder.Id;
                orderItem.TotalPrice = orderItem.Quantity * orderItem.UnitPrice;
                return orderItem;
            }).ToList();

            existingOrder.Items = newItems;

            // Diğer alanları güncelle
            existingOrder.Status = orderUpdateDto.Status;
            existingOrder.PaymentStatus = orderUpdateDto.PaymentStatus;
            existingOrder.DeliveryDate = orderUpdateDto.DeliveryDate?.ToUniversalTime();
            existingOrder.UpdatedAt = DateTimeOffset.UtcNow;

            // Burada Update çağırmana gerek yok, zaten tracked entity güncelleniyor.

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("Veri başka bir işlem tarafından değiştirildi veya silindi. Lütfen sayfayı yenileyin ve tekrar deneyin.");
            }

            return NoContent();
        }

        // DELETE: api/orders/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null) return NotFound();

            if (order.Items != null)
                _context.OrderItems.RemoveRange(order.Items);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
