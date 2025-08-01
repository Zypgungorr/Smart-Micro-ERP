namespace AkilliMikroERP.Dtos
{
    public class LoginUserDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
        public class RegisterUserDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
         public int RoleId { get; set; } 
    }
}
