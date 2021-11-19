
using System;
using System.Collections.Generic;
using System.Dynamic;
using giddy_dotnet.Encryption;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace giddy_dotnet.Repository
{
    public static class PartiallySecureService
    {
        //Database simulation
        private static Dictionary<string, string> tokensPerUser = new Dictionary<string, string>();
        public static dynamic generate_tokens(IConfiguration config)
        {
            try 
            {
                //The username should come as a parameter from somewhere else and not be hardcoded.
                var username = "test";
                var jwtFactory = new JwtFactory(config);
                var refreshToken = jwtFactory.generate_refresh_token(username);
                tokensPerUser.Add(username, refreshToken);
            
                dynamic tokens = new ExpandoObject();
                tokens.token = jwtFactory.generate_token(username);
                tokens.refreshToken = refreshToken;
                return tokens;
            }
            catch(Exception)
            {
                return null;
            }
        }
        
        public static dynamic refresh_token (IConfiguration config, string refreshToken, string username)
        {
            var savedToken = tokensPerUser[username];
            if (savedToken == null || !savedToken.Equals(refreshToken)) return null;
            
            var jwtFactory = new JwtFactory(config);
            dynamic tokens = new ExpandoObject();
            tokens.token = jwtFactory.generate_token(username);
            tokens.refreshToken = jwtFactory.generate_refresh_token(username);;
            return tokens;
        }
    }
}
