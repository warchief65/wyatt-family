using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext        _db;
    private readonly UserManager<AppUser> _users;
    private readonly IEmailService        _email;
    private readonly IConfiguration       _config;

    public AdminController(AppDbContext db, UserManager<AppUser> users,
        IEmailService email, IConfiguration config)
    {
        _db = db; _users = users; _email = email; _config = config;
    }

    // Dashboard stats
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        return Ok(new {
            photos             = await _db.MediaItems.CountAsync(m => m.Type == MediaType.Photo),
            videos             = await _db.MediaItems.CountAsync(m => m.Type == MediaType.Video),
            documents          = await _db.Documents.CountAsync(),
            stories            = await _db.Stories.CountAsync(),
            people             = await _db.People.CountAsync(),
            users              = await _db.Users.CountAsync(),
            comments           = await _db.Comments.CountAsync(),
            pendingUsers       = await _db.Users.CountAsync(u => u.Status == UserStatus.Pending),
            pendingSubmissions = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Pending),
            totalDonations     = await _db.Donations.SumAsync(d => (decimal?)d.Amount) ?? 0m,
        });
    }

    // Recent activity feed
    [HttpGet("activity")]
    public async Task<IActionResult> Activity()
    {
        var recentComments = await _db.Comments
            .Include(c => c.Author)
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .Select(c => new { id = $"c{c.Id}", icon = "💬", text = $"{c.Author.FirstName} commented on {c.ArtifactType} #{c.ArtifactId}", time = c.CreatedAt })
            .ToListAsync();

        var recentSubs = await _db.Submissions
            .Include(s => s.SubmittedBy)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(5)
            .Select(s => new { id = $"s{s.Id}", icon = "📤", text = $"{s.SubmittedBy.FirstName} submitted \"{s.Title}\"", time = s.SubmittedAt })
            .ToListAsync();

        var activity = recentComments.Cast<object>().Concat(recentSubs)
            .OrderByDescending(a => ((dynamic)a).time)
            .Take(10);

        return Ok(activity);
    }

    // ── Users ─────────────────────────────────────────────────────
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string status = "all", [FromQuery] string? q = null)
    {
        var query = _db.Users.AsQueryable();

        if (status != "all")
        {
            var s = Enum.Parse<UserStatus>(status, ignoreCase: true);
            query = query.Where(u => u.Status == s);
        }
        if (!string.IsNullOrEmpty(q))
            query = query.Where(u => u.Email!.Contains(q) || u.FirstName.Contains(q) || u.LastName.Contains(q));

        var users = await query
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email, status = u.Status.ToString().ToLower(), u.CreatedAt })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var counts = new {
            all      = await _db.Users.CountAsync(),
            pending  = await _db.Users.CountAsync(u => u.Status == UserStatus.Pending),
            approved = await _db.Users.CountAsync(u => u.Status == UserStatus.Approved),
            inactive = await _db.Users.CountAsync(u => u.Status == UserStatus.Inactive),
        };

        return Ok(new { users, counts });
    }

    [HttpPost("users/{id}/approve")]
    public async Task<IActionResult> ApproveUser(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null) return NotFound();
        user.Status = UserStatus.Approved;
        await _users.UpdateAsync(user);
        await _email.SendAsync(user.Email!, "Your Wyatt Family Access is Approved",
            $"<p>Hi {user.FirstName}, your request to access the Wyatt Family archive has been approved!</p>" +
            $"<p><a href='{_config["Frontend:BaseUrl"]}/login'>Sign in here</a></p>");
        return Ok();
    }

    [HttpPost("users/{id}/reject")]
    public async Task<IActionResult> RejectUser(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null) return NotFound();
        user.Status = UserStatus.Rejected;
        await _users.UpdateAsync(user);
        await _email.SendAsync(user.Email!, "Wyatt Family Access Request",
            $"<p>Hi {user.FirstName}, unfortunately your access request could not be approved at this time.</p>");
        return Ok();
    }

    [HttpPost("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null) return NotFound();
        user.Status = UserStatus.Inactive;
        await _users.UpdateAsync(user);
        return Ok();
    }

    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _users.FindByIdAsync(id);
        if (user is null) return NotFound();
        await _users.DeleteAsync(user);
        return Ok();
    }

    // ── Submissions ───────────────────────────────────────────────
    [HttpGet("submissions")]
    public async Task<IActionResult> GetSubmissions([FromQuery] string status = "pending")
    {
        var query = _db.Submissions.Include(s => s.SubmittedBy).Include(s => s.Files).AsQueryable();
        if (status != "all")
        {
            var s = Enum.Parse<SubmissionStatus>(status, ignoreCase: true);
            query = query.Where(sub => sub.Status == s);
        }

        var subs = await query.OrderByDescending(s => s.SubmittedAt).ToListAsync();
        var counts = new {
            pending  = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Pending),
            approved = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Approved),
            rejected = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Rejected),
            all      = await _db.Submissions.CountAsync(),
        };
        return Ok(new { submissions = subs, counts });
    }

    [HttpPost("submissions/{id:int}/approve")]
    public async Task<IActionResult> ApproveSubmission(int id)
    {
        var sub = await _db.Submissions.Include(s => s.SubmittedBy).FirstOrDefaultAsync(s => s.Id == id);
        if (sub is null) return NotFound();
        sub.Status     = SubmissionStatus.Approved;
        sub.ReviewedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _email.SendAsync(sub.SubmittedBy.Email!, $"Your submission \"{sub.Title}\" was approved",
            $"<p>Hi {sub.SubmittedBy.FirstName}, your submission has been approved and published to the archive!</p>");
        return Ok();
    }

    [HttpPost("submissions/{id:int}/reject")]
    public async Task<IActionResult> RejectSubmission(int id, [FromBody] RejectRequest req)
    {
        var sub = await _db.Submissions.Include(s => s.SubmittedBy).FirstOrDefaultAsync(s => s.Id == id);
        if (sub is null) return NotFound();
        sub.Status          = SubmissionStatus.Rejected;
        sub.ReviewedAt      = DateTime.UtcNow;
        sub.RejectionReason = req.Reason;
        await _db.SaveChangesAsync();
        await _email.SendAsync(sub.SubmittedBy.Email!, $"Your submission \"{sub.Title}\"",
            $"<p>Hi {sub.SubmittedBy.FirstName}, your submission was not approved." +
            (req.Reason != null ? $" Reason: {req.Reason}" : "") + "</p>");
        return Ok();
    }

    // ── Donations ─────────────────────────────────────────────────
    [HttpGet("donations")]
    public async Task<IActionResult> GetDonations()
    {
        var donations = await _db.Donations
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new { d.Id, d.Amount, d.DonorName, d.DonorMessage, d.IsPublic, d.CreatedAt })
            .ToListAsync();
        var total = await _db.Donations.SumAsync(d => (decimal?)d.Amount) ?? 0m;
        return Ok(new { donations, total, count = donations.Count });
    }
}

public record RejectRequest(string? Reason);
