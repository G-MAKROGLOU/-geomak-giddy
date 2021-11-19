using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using giddy_dotnet.Commons;
using Microsoft.IdentityModel.Tokens;

namespace giddy_dotnet.Encryption
{
    public class JwtFactory
    {
        private readonly JwtBlueprint _jwtBlueprint;

        public JwtFactory(IConfiguration config)
        {
            
            _jwtBlueprint = new JwtBlueprint()
            {
                Secret = Utils.get_env_var(config, "jwtTokenConfig:Secret"),
                RefreshSecret = Utils.get_env_var(config, "jwtTokenConfig:RefreshSecret"),
                Issuer = Utils.get_env_var(config, "jwtTokenConfig:Issuer"),
                Audience = Utils.get_env_var(config, "jwtTokenConfig:Audience"),
                AccessTokenExpiration = int.Parse(Utils.get_env_var(config, "jwtTokenConfig:AccessTokenExpiration"))
            };
        }
        
        
        public dynamic generate_token(string username)
        {
            var secretInBytes = Encoding.ASCII.GetBytes(_jwtBlueprint.Secret);
            var claims = new[]
            {
                new Claim("username", username),
            };
            
            var tokenBlueprint = new JwtSecurityToken(
                _jwtBlueprint.Issuer,
                _jwtBlueprint.Audience,
                claims,
                null,
                DateTime.Now.AddMinutes(_jwtBlueprint.AccessTokenExpiration),
                new SigningCredentials(new SymmetricSecurityKey(secretInBytes), SecurityAlgorithms.HmacSha256Signature)
            );
            
            return new JwtSecurityTokenHandler().WriteToken(tokenBlueprint);
        }
        
        
        public dynamic generate_refresh_token(string username)
        {
            var secretInBytes = Encoding.ASCII.GetBytes(_jwtBlueprint.RefreshSecret);
            var claims = new[]
            {
                new Claim("username", username)
            };
            
            var tokenBlueprint = new JwtSecurityToken(
                _jwtBlueprint.Issuer,
                _jwtBlueprint.Audience,
                claims,
                null,
                DateTime.Now.AddHours(_jwtBlueprint.AccessTokenExpiration),
                new SigningCredentials(new SymmetricSecurityKey(secretInBytes), SecurityAlgorithms.HmacSha256Signature)
            );
            
            return new JwtSecurityTokenHandler().WriteToken(tokenBlueprint);
        }



    }
}