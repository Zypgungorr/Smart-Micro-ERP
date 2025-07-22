using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using AkilliMikroERP.Services;
using Microsoft.AspNetCore.Authorization;

namespace AkilliMikroERP.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly GeminiService _geminiService;

        public AiController(GeminiService geminiService)
        {
            _geminiService = geminiService;
        }

        [AllowAnonymous]
        [HttpPost("ask")]
        public async Task<IActionResult> AskGemini([FromBody] PromptRequest request)
        {
            var result = await _geminiService.AskGemini(request.Prompt, request.Model, request.Type, request.RelatedId);
            return Ok(new { result });
        }
    }

    public class PromptRequest
    {
        public string Prompt { get; set; }
        public string Model { get; set; } = "gemini-1.5-flash";
        public string Type { get; set; } = "generic";
        public Guid? RelatedId { get; set; }
    }
}
