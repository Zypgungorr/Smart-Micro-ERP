
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AkilliMikroERP.Data;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class CustomerController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public CustomerController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetAll()
    {
        var customers = _context.Customers
            .Include(c => c.Orders)
            .ThenInclude(o => o.Items)
            .ThenInclude(oi => oi.Product)
            .ToList();

        var dtos = customers.Select(c => _mapper.Map<CustomerDetailWithOrdersDto>(c)).ToList();
        return Ok(dtos);
    }

    [HttpGet("{id}")]
    public IActionResult Get(Guid id)
    {
        var customer = _context.Customers
            .Include(c => c.Orders)
            .ThenInclude(o => o.Items)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefault(c => c.Id == id);

        if (customer == null) return NotFound();

        var dto = _mapper.Map<CustomerDetailWithOrdersDto>(customer);
        return Ok(dto);
    }

    [HttpPost]
    [AllowAnonymous]
    public IActionResult Create([FromBody] CustomerCreateDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            Type = dto.Type,
            Segment = dto.Segment
        };

        _context.Customers.Add(customer);
        _context.SaveChanges();

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    [AllowAnonymous]
    public IActionResult Update(Guid id, [FromBody] CustomerCreateDto dto)
    {
        var customer = _context.Customers.Find(id);
        if (customer == null) return NotFound();

        customer.Name = dto.Name;
        customer.Email = dto.Email;
        customer.Phone = dto.Phone;
        customer.Address = dto.Address;
        customer.City = dto.City;
        customer.Country = dto.Country;
        customer.Type = dto.Type;
        customer.Segment = dto.Segment;

        _context.SaveChanges();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [AllowAnonymous]
    public IActionResult Delete(Guid id)
    {
        var customer = _context.Customers.Find(id);
        if (customer == null) return NotFound();

        _context.Customers.Remove(customer);
        _context.SaveChanges();
        return NoContent();
    }
}
