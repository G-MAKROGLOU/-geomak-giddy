using System.Dynamic;
using giddy_dotnet.Encryption;
using giddy_dotnet.Models;
using giddy_dotnet.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace giddy_dotnet.Controllers
{
    [Route("api/partially-secure-demo")]
    [ApiController]
    public class PartiallySecureController : ControllerBase
    {
        
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Dependency Injection to get access to the IConfiguration interface in order to access Environment Variables
        /// </summary>
        /// <param name="config">The IConfiguration that gets injected</param>
        public PartiallySecureController(IConfiguration config)
        {
            _configuration = config;
        }

        
        /// <summary>
        /// Non-secure route to get tokens
        /// </summary>
        /// <returns>Two tokens - the normal token and the refresh token</returns>
        [HttpGet("tokens")]
        public IActionResult GetTokens()
        {
            var tokens = PartiallySecureService.generate_tokens(_configuration);
            return tokens != null ? Ok(tokens) : BadRequest("This is a demo endpoint and will work only once because of the implementation. Change the code to suit your needs.");
        }
        
        
      
        /// <summary>
        /// Refreshes both tokens
        /// </summary>
        /// <param name="tokenModel"></param>
        /// <returns></returns>
        [HttpPost("refresh-tokens")]
        public IActionResult RefreshTokens(RefreshTokenModel tokenModel)
        {
            var authCheck = PartiallySecureService.refresh_token(_configuration, tokenModel.RefreshToken, tokenModel.Username);
            dynamic error = new ExpandoObject();
            error.message = "You refresh token has expired. Sign back in to get a new set of tokens";
            return authCheck != null ? Ok(authCheck) : Unauthorized(error);
        }
        
        
        /// <summary>
        /// Refreshes refreshToken
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpPost("refresh-token")]
        public IActionResult RefreshToken()
        {
            var jwtFactory = new JwtFactory(_configuration);
            dynamic newToken = new ExpandoObject();
            newToken.refreshToken = jwtFactory.generate_refresh_token("test");
            return Ok(newToken);
        }
        
        
    }
}