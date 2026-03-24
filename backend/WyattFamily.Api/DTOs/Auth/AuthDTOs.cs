using System.ComponentModel.DataAnnotations;

namespace WyattFamily.Api.DTOs.Auth;

public class RegisterRequest
{
    [Required] public string FirstName { get; set; } = "";
    [Required] public string LastName  { get; set; } = "";
    [Required, EmailAddress] public string Email    { get; set; } = "";
    [Required, MinLength(8)] public string Password { get; set; } = "";
    public string? Relation { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress] public string Email    { get; set; } = "";
    [Required]               public string Password { get; set; } = "";
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress] public string Email { get; set; } = "";
}

public class ResetPasswordRequest
{
    [Required, EmailAddress] public string Email       { get; set; } = "";
    [Required]               public string Token       { get; set; } = "";
    [Required, MinLength(8)] public string NewPassword { get; set; } = "";
}
