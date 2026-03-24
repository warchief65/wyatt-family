using Microsoft.AspNetCore.Identity;
using WyattFamily.Api.Models;

namespace WyattFamily.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var userMgr  = services.GetRequiredService<UserManager<AppUser>>();
        var roleMgr  = services.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure roles exist
        foreach (var role in new[] { "admin", "member" })
        {
            if (!await roleMgr.RoleExistsAsync(role))
                await roleMgr.CreateAsync(new IdentityRole(role));
        }

        // Seed admin user
        const string adminEmail = "admin@alanwyatt.com";
        if (await userMgr.FindByEmailAsync(adminEmail) is null)
        {
            var admin = new AppUser
            {
                UserName   = adminEmail,
                Email      = adminEmail,
                FirstName  = "Alan",
                LastName   = "Wyatt",
                Status     = UserStatus.Approved,
                EmailConfirmed = true
            };
            var result = await userMgr.CreateAsync(admin, "Admin@Wyatt2026!");
            if (result.Succeeded)
                await userMgr.AddToRoleAsync(admin, "admin");
        }
    }
}
