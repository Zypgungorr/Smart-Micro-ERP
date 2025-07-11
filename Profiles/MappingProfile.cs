using AutoMapper;
using AkilliMikroERP.Models;
using AkilliMikroERP.Dtos;

namespace AkilliMikroERP.Profiles
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Create DTO -> Entity
            CreateMap<OrderCreateDto, Order>();
            CreateMap<OrderItemCreateDto, OrderItem>();

            // Update DTO -> Entity
            CreateMap<OrderUpdateDto, Order>();

            // Entity -> Read DTO
            CreateMap<Order, OrderReadDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : null))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Items));

            CreateMap<OrderItem, OrderItemReadDto>()
                .ForMember(dest => dest.ProductName, opt => opt.MapFrom(src => src.Product != null ? src.Product.Name : null))
                .ForMember(dest => dest.TotalPrice, opt => opt.MapFrom(src => src.Quantity * src.UnitPrice));
            CreateMap<OrderItemCreateDto, OrderItem>();
            CreateMap<OrderCreateDto, Order>();
            CreateMap<Order, OrderReadDto>();
            CreateMap<OrderItem, OrderItemReadDto>();

        }
    }
}
