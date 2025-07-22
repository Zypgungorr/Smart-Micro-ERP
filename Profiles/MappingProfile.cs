using AutoMapper;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;

namespace AkilliMikroERP.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Order mappings
            CreateMap<OrderCreateDto, Order>();
            CreateMap<OrderUpdateDto, Order>();

            CreateMap<OrderItemCreateDto, OrderItem>();

            CreateMap<Order, OrderReadDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : null))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items))
                .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.Items != null ? src.Items.Sum(i => i.TotalPrice) : 0));

            CreateMap<OrderItem, OrderItemReadDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : null))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));

            // Invoice mappings
            CreateMap<InvoiceCreateDto, Invoice>()
                .ForMember(dest => dest.InvoiceDate, opt => opt.MapFrom(_ => DateTimeOffset.UtcNow))
                .ForMember(dest => dest.Items, opt => opt.Ignore()); // manual

            CreateMap<InvoiceItemCreateDto, InvoiceItem>()
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));

            CreateMap<Invoice, InvoiceReadDto>()
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

            CreateMap<InvoiceItem, InvoiceItemReadDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : null))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
        }
    }
}
