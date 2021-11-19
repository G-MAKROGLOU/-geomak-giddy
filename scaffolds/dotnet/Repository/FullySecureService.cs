using System.Collections.Generic;
using System.Linq;
using giddy_dotnet.Encryption;
using giddy_dotnet.Models;

namespace giddy_dotnet.Repository
{
    public static class FullySecureService
    {
        public static List<UserModel> get_users()
        {
            var userNames = new List<string>()
            {
                "John Doe",
                "Jane Doe",
                "Example User1",
                "Example User2",
                "Example User3",
                "Example User4",
                "Example User5",
                "Example User6",
                "Example User7",
            };
            
            return Enumerable.Range(1, 9).Select(x => new UserModel()
            {
                Username=userNames[x-1],
                Password=BCryptFactory.hash_password(userNames[x-1]),
                Email=$"{userNames[x-1].Split(" ")[0]}@{userNames[x-1].Split(" ")[0]}.com",
                Age=x*12
            }).ToList();
        }
    }
}