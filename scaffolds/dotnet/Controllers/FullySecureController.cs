using System.Collections.Generic;
using System.Linq;
using giddy_dotnet.Encryption;
using giddy_dotnet.Models;
using giddy_dotnet.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace giddy_dotnet.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/fully-secure-routes")]
    public class FullSecureRoutes : ControllerBase
    {


        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            return Ok(FullySecureService.get_users());
        }
        
    }
}