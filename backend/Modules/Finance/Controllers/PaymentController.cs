using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediCore.API.Infrastructure.Database.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Hubs;

namespace MediCore.API.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCoreHub> _hubContext;

        public PaymentController(MediCoreDbContext context, IHubContext<MediCoreHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // POST api/payment/create-order
        [HttpPost("create-order")]
        [Authorize(Roles = "Patient,SuperAdmin")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            return BadRequest(new { success = false, message = "Online payments are currently launching soon! Please pay at the hospital reception." });
        }

        // POST api/payment/verify
        [HttpPost("verify")]
        [Authorize(Roles = "Patient,SuperAdmin")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest request)
        {
            return BadRequest(new { success = false, message = "Payment verification is temporarily disabled as we prepare for launch." });
        }
    }

    public class CreateOrderRequest
    {
        public int BillId { get; set; }
    }

    public class VerifyPaymentRequest
    {
        public int BillId { get; set; }
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }
}
