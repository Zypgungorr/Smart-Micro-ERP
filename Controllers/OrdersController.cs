using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

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
        [AllowAnonymous]
        public async Task<ActionResult<List<OrderReadDto>>> GetOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Invoice) // Fatura bilgisini de getir
                .ToListAsync();

            var orderDtos = _mapper.Map<List<OrderReadDto>>(orders);
            
            // Her sipariş için hasInvoice bilgisini ekle
            foreach (var orderDto in orderDtos)
            {
                var order = orders.FirstOrDefault(o => o.Id == orderDto.Id);
                orderDto.HasInvoice = order?.Invoice != null;
            }
            
            return Ok(orderDtos);
        }

        // GET: api/orders/{id}
        [HttpGet("{id}")]
        [AllowAnonymous]
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
        [AllowAnonymous]
        public async Task<ActionResult<OrderReadDto>> CreateOrder(OrderCreateDto orderCreateDto)
        {
            var order = _mapper.Map<Order>(orderCreateDto);
            order.OrderDate = DateTimeOffset.UtcNow;
            
            // Otomatik sipariş numarası üret
            order.OrderNumber = await GenerateUniqueOrderNumber();

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



        // Benzersiz sipariş numarası üretme metodu
        private async Task<string> GenerateUniqueOrderNumber()
        {
            var random = new Random();
            string orderNumber;
            bool isUnique = false;

            do
            {
                // 6 haneli random sayı üret (100000-999999)
                orderNumber = random.Next(100000, 1000000).ToString();
                
                // Veritabanında bu numara var mı kontrol et
                isUnique = !await _context.Orders.AnyAsync(o => o.OrderNumber == orderNumber);
            } while (!isUnique);

            return orderNumber;
        }

        // POST: api/orders/{id}/approve - Siparişi onayla
        [HttpPost("{id}/approve")]
        [AllowAnonymous]
        public async Task<IActionResult> ApproveOrder(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Sipariş bulunamadı." });
            }

            if (order.Status == "onaylandı")
            {
                return BadRequest(new { message = "Bu sipariş zaten onaylanmış." });
            }

            if (order.Status == "iptal")
            {
                return BadRequest(new { message = "İptal edilmiş sipariş onaylanamaz." });
            }

            // Siparişi onayla
            order.Status = "onaylandı";
            order.ApprovedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Sipariş başarıyla onaylandı.",
                orderId = order.Id,
                status = order.Status
            });
        }

        // POST: api/orders/{id}/reject - Siparişi reddet
        [HttpPost("{id}/reject")]
        [AllowAnonymous]
        public async Task<IActionResult> RejectOrder(Guid id)
        {
            var order = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Items)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Sipariş bulunamadı." });
            }

            if (order.Status == "onaylandı")
            {
                return BadRequest(new { message = "Onaylanmış sipariş reddedilemez." });
            }

            if (order.Status == "iptal")
            {
                return BadRequest(new { message = "Bu sipariş zaten iptal edilmiş." });
            }

            // Siparişi reddet
            order.Status = "iptal";
            order.RejectedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Sipariş başarıyla reddedildi.",
                orderId = order.Id,
                status = order.Status
            });
        }

        // PUT: api/orders/{id}
        [HttpPut("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdateOrder(Guid id, OrderUpdateDto orderUpdateDto)
        {
            var existingOrder = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (existingOrder == null)
                return NotFound($"Order with id {id} not found.");

            var existingItems = existingOrder.Items.ToList();
            var newItemsDto = orderUpdateDto.Items;

            var itemsToRemove = existingItems
                .Where(ei => !newItemsDto.Any(ni => ni.ProductId == ei.ProductId))
                .ToList();

            _context.OrderItems.RemoveRange(itemsToRemove);

            foreach (var existingItem in existingItems)
            {
                var updatedItemDto = newItemsDto.FirstOrDefault(ni => ni.ProductId == existingItem.ProductId);
                if (updatedItemDto != null)
                {
                    existingItem.Quantity = updatedItemDto.Quantity;
                    existingItem.UnitPrice = updatedItemDto.UnitPrice;
                    existingItem.TotalPrice = updatedItemDto.Quantity * updatedItemDto.UnitPrice;
                }
            }

            var itemsToAdd = newItemsDto
                .Where(ni => !existingItems.Any(ei => ei.ProductId == ni.ProductId))
                .ToList();

            foreach (var newItemDto in itemsToAdd)
            {
                var newItem = _mapper.Map<OrderItem>(newItemDto);
                newItem.OrderId = existingOrder.Id;
                newItem.TotalPrice = newItem.Quantity * newItem.UnitPrice;

                _context.OrderItems.Add(newItem);
            }

            existingOrder.Status = orderUpdateDto.Status;
            existingOrder.PaymentStatus = orderUpdateDto.PaymentStatus;
            existingOrder.DeliveryDate = orderUpdateDto.DeliveryDate?.ToUniversalTime();
            existingOrder.UpdatedAt = DateTimeOffset.UtcNow;

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
        [AllowAnonymous]
        public async Task<IActionResult> DeleteOrder(Guid id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.Items)
                    .Include(o => o.Invoice) // İlişkili faturayı kontrol et
                    .FirstOrDefaultAsync(o => o.Id == id);

                if (order == null) 
                    return NotFound(new { message = "Sipariş bulunamadı." });

                // İlişkili fatura varsa silmeye izin verme
                if (order.Invoice != null)
                {
                    return BadRequest(new { 
                        message = "Bu siparişe bağlı fatura bulunmaktadır. Fatura kesilmiş siparişler silinemez. Siparişi 'İptal Edildi' olarak işaretleyebilirsiniz." 
                    });
                }

                // Sipariş kalemlerini sil
                if (order.Items != null && order.Items.Any())
                {
                    _context.OrderItems.RemoveRange(order.Items);
                }

                // Siparişi sil
                _context.Orders.Remove(order);
                
                await _context.SaveChangesAsync();

                return Ok(new { message = "Sipariş başarıyla silindi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Sipariş silinirken hata oluştu: {ex.Message}" });
            }
        }
    }
}
