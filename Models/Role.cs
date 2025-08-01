using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Permissions { get; set; } 
        public ICollection<User>? Users { get; set; }
    }
}