using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WyattFamily.Api.DTOs.Auth;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser>  _users;
    private readonly SignInManager<AppUser> _signIn;
    private readonly IConfiguration        _config;
    private readonly IEmailService         _email;

    public AuthController(UserManager<AppUser> users, SignInManager<AppUser> signIn,
        IConfiguration config, IEmailService email)
    {
        _users  = users;
        _signIn = signIn;
        _config = config;
        _email  = email;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var user = new AppUser
        {
            UserName   = req.Email,
            Email      = req.Email,
            FirstName  = req.FirstName,
            LastName   = req.LastName,
            Relation   = req.Relation ?? "",
            Status     = UserStatus.Pending,
            EmailConfirmed = true
        };

        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Errors.First().Description });

        await _users.AddToRoleAsync(user, "member");

        // Notify admin
        var adminEmail = _config["Email:FromAddress"]!;
        await _email.SendAsync(adminEmail, "New Registration Request",
            $"<p>{req.FirstName} {req.LastName} ({req.Email}) has requested access to the Wyatt Family archive.</p>" +
            $"<p>Relation: {req.Relation}</p>" +
            $"<p><a href='{_config["Frontend:BaseUrl"]}/admin/users'>Review in Admin Panel</a></p>");

        return Ok(new { message = "Registration submitted. Awaiting admin approval." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null) return Unauthorized(new { message = "Invalid email or password." });

        var result = await _signIn.CheckPasswordSignInAsync(user, req.Password, false);
        if (!result.Succeeded) return Unauthorized(new { message = "Invalid email or password." });

        return Ok(new
        {
            token = GenerateToken(user),
            user  = MapUser(user)
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return Ok(MapUser(user));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req)
    {
        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null) return Ok(); // Don't reveal if email exists

        var token    = await _users.GeneratePasswordResetTokenAsync(user);
        var resetUrl = $"{_config["Frontend:BaseUrl"]}/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(req.Email)}";

        await _email.SendAsync(req.Email, "Reset Your Password",
            $"<p>Click below to reset your password:</p><p><a href='{resetUrl}'>Reset Password</a></p>");

        return Ok(new { message = "If that email exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req)
    {
        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null) return BadRequest(new { message = "Invalid request." });

        var result = await _users.ResetPasswordAsync(user, req.Token, req.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Errors.First().Description });

        return Ok(new { message = "Password reset successfully." });
    }

    private string GenerateToken(AppUser user)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddDays(double.Parse(_config["Jwt:ExpiryDays"] ?? "7"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim("firstName", user.FirstName),
            new Claim("lastName",  user.LastName),
            new Claim("status",    user.Status.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:   _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims:   claims,
            expires:  expires,
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static object MapUser(AppUser u) => new
    {
        u.Id, u.Email, u.FirstName, u.LastName,
        status = u.Status.ToString().ToLower(),
        role   = "member" // enriched from role claims in full impl
    };
}
