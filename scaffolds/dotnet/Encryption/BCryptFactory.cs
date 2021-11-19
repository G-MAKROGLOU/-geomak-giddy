namespace giddy_dotnet.Encryption
{
    public static class BCryptFactory
    {
        public static string hash_password(string plainText)
        {
            return BCrypt.Net.BCrypt.HashPassword(plainText);
        }
        
        public static bool verify_password(string plainText, string hashed)
        {
            return BCrypt.Net.BCrypt.Verify(plainText, hashed);
        }
    }
}