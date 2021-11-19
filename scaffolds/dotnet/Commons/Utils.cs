using Microsoft.Extensions.Configuration;

namespace giddy_dotnet.Commons
{
    public static class Utils
    {
        public static string get_env_var(IConfiguration config, string varName)
        {
            return config.GetValue<string>($"{varName}");
        }
    }
}