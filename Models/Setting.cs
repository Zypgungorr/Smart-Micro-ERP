
using System;
using System.Collections.Generic;

namespace AkilliMikroERP.Models
{
    public class Setting
    {
        public int Id { get; set; }
        public string? Key { get; set; }
        public string? Value { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
