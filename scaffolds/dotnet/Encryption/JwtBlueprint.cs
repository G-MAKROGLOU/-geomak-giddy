namespace giddy_dotnet.Encryption
{
    public class JwtBlueprint
    {
        public string Secret { get; set; }
        public string RefreshSecret { get; set; }
        public string Issuer { get; set; }
        public string Audience { get; set; }
        public int AccessTokenExpiration { get; set; }
    }
}