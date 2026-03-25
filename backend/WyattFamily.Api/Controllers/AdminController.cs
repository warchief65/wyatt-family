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
    private readonly IBlobService          _blobs;

    public AdminController(AppDbContext db, UserManager<AppUser> users,
        IEmailService email, IConfiguration config, IBlobService blobs)
    {
        _db = db; _users = users; _email = email; _config = config; _blobs = blobs;
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
        var projected = subs.Select(s => new {
            s.Id,
            status          = s.Status.ToString().ToLower(),
            contentType     = s.ContentType,
            submittedAt     = s.SubmittedAt,
            title           = s.Title,
            submittedBy     = $"{s.SubmittedBy.FirstName} {s.SubmittedBy.LastName}".Trim(),
            description     = s.Description,
            date            = s.DateDisplay,
            location        = s.Location,
            people          = s.People,
            tags            = s.Tags,
            source          = s.Source,
            rejectionReason = s.RejectionReason,
            files           = s.Files.Select(f => new {
                url     = _blobs.GetUrl(f.StorageKey, false),
                isImage = f.ContentType.StartsWith("image/"),
                name    = f.FileName,
            }),
        });
        var counts = new {
            pending  = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Pending),
            approved = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Approved),
            rejected = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Rejected),
            all      = await _db.Submissions.CountAsync(),
        };
        return Ok(new { submissions = projected, counts });
    }

    [HttpPost("submissions/{id:int}/approve")]
    public async Task<IActionResult> ApproveSubmission(int id)
    {
        var sub = await _db.Submissions
            .Include(s => s.SubmittedBy)
            .Include(s => s.Files)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sub is null) return NotFound();

        sub.Status     = SubmissionStatus.Approved;
        sub.ReviewedAt = DateTime.UtcNow;

        // Publish content based on submission type
        switch (sub.ContentType.ToLower())
        {
            case "photo":
            case "video":
            {
                var firstImage = sub.Files.FirstOrDefault(f => f.ContentType.StartsWith("image/"));
                var album = new Album
                {
                    Title       = sub.Title,
                    Description = sub.Description,
                    DateDisplay = sub.DateDisplay,
                    Location    = sub.Location,
                    CoverUrl    = firstImage != null ? _blobs.GetUrl(firstImage.StorageKey, false) : null,
                };
                _db.Albums.Add(album);
                await _db.SaveChangesAsync();

                foreach (var file in sub.Files)
                {
                    var isVideo = file.ContentType.StartsWith("video/");
                    _db.MediaItems.Add(new MediaItem
                    {
                        AlbumId       = album.Id,
                        Type          = isVideo ? MediaType.Video : MediaType.Photo,
                        Title         = sub.Title,
                        Description   = sub.Description,
                        StorageKey    = file.StorageKey,
                        ThumbnailKey  = file.ContentType.StartsWith("image/") ? file.StorageKey : null,
                        DateDisplay   = sub.DateDisplay,
                        Location      = sub.Location,
                        Source        = sub.Source,
                        FileSizeBytes = file.FileSizeBytes,
                    });
                }
                await _db.SaveChangesAsync();
                break;
            }
            case "document":
            {
                foreach (var file in sub.Files)
                {
                    _db.Documents.Add(new Document
                    {
                        Title       = sub.Title,
                        Description = sub.Description,
                        StorageKey  = file.StorageKey,
                        DateDisplay = sub.DateDisplay,
                        Location    = sub.Location,
                        Source      = sub.Source,
                        DocType     = DocumentType.Other,
                    });
                }
                await _db.SaveChangesAsync();
                break;
            }
            case "story":
            {
                _db.Stories.Add(new Story
                {
                    Title       = sub.Title,
                    Body        = sub.Description ?? "",
                    Excerpt     = sub.Description?.Length > 200
                        ? sub.Description[..200] + "..."
                        : sub.Description,
                    DateDisplay = sub.DateDisplay,
                });
                await _db.SaveChangesAsync();
                break;
            }
        }

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

    // ── Media Items (all, flat list) ──────────────────────────────
    [HttpGet("media-items")]
    public async Task<IActionResult> GetAllMediaItems()
    {
        var items = await _db.MediaItems
            .Include(i => i.Album)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var projected = items.Select(i => new {
            i.Id,
            i.Title,
            type         = i.Type.ToString().ToLower(),
            albumId      = i.AlbumId,
            albumTitle   = i.Album?.Title,
            thumbnailUrl = _blobs.GetUrl(i.ThumbnailKey, i.IsPrivate),
            url          = _blobs.GetUrl(i.StorageKey, i.IsPrivate),
            i.IsPrivate,
            i.DateDisplay,
            i.Location,
            i.CreatedAt,
            i.FileSizeBytes,
        });

        return Ok(projected);
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

    // ── Bulk Upload ───────────────────────────────────────────────
    [HttpPost("bulk-upload")]
    [RequestSizeLimit(2_000_000_000)] // 2 GB
    public async Task<IActionResult> BulkUpload([FromForm] BulkUploadRequest req)
    {
        if (req.Files is null || req.Files.Count == 0)
            return BadRequest(new { message = "No files provided." });

        var results = new List<object>();

        switch (req.ContentType.ToLower())
        {
            case "photo":
            case "video":
            {
                Album album;
                if (req.AlbumId.HasValue)
                {
                    var existing = await _db.Albums.FindAsync(req.AlbumId.Value);
                    if (existing is null) return BadRequest(new { message = "Album not found." });
                    album = existing;
                }
                else
                {
                    album = new Album
                    {
                        Title       = req.Title,
                        Description = req.Description,
                        DateDisplay = req.Date,
                        Location    = req.Location,
                    };
                    _db.Albums.Add(album);
                    await _db.SaveChangesAsync();
                }

                string? coverUrl = null;
                foreach (var file in req.Files)
                {
                    var isVideo = file.ContentType.StartsWith("video/");
                    var key     = $"albums/{album.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                    await using var stream = file.OpenReadStream();
                    await _blobs.UploadAsync(key, stream, file.ContentType, isPrivate: false);

                    if (coverUrl == null && file.ContentType.StartsWith("image/"))
                        coverUrl = _blobs.GetUrl(key, false);

                    _db.MediaItems.Add(new MediaItem
                    {
                        AlbumId       = album.Id,
                        Type          = isVideo ? MediaType.Video : MediaType.Photo,
                        Title         = Path.GetFileNameWithoutExtension(file.FileName),
                        Description   = req.Description,
                        StorageKey    = key,
                        ThumbnailKey  = file.ContentType.StartsWith("image/") ? key : null,
                        DateDisplay   = req.Date,
                        Location      = req.Location,
                        Source        = req.Source,
                        FileSizeBytes = file.Length,
                    });
                    results.Add(new { fileName = file.FileName, status = "uploaded" });
                }
                album.CoverUrl = coverUrl;
                await _db.SaveChangesAsync();
                break;
            }
            case "document":
            {
                foreach (var file in req.Files)
                {
                    var key = $"documents/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                    await using var stream = file.OpenReadStream();
                    await _blobs.UploadAsync(key, stream, file.ContentType, isPrivate: false);

                    _db.Documents.Add(new Document
                    {
                        Title       = !string.IsNullOrEmpty(req.Title)
                            ? req.Title
                            : Path.GetFileNameWithoutExtension(file.FileName),
                        Description = req.Description,
                        StorageKey  = key,
                        DateDisplay = req.Date,
                        Location    = req.Location,
                        Source      = req.Source,
                        DocType     = DocumentType.Other,
                    });
                    results.Add(new { fileName = file.FileName, status = "uploaded" });
                }
                await _db.SaveChangesAsync();
                break;
            }
            default:
                return BadRequest(new { message = $"Unsupported content type '{req.ContentType}'." });
        }

        return Ok(new { uploaded = results.Count, items = results });
    }
}

public record RejectRequest(string? Reason);

public record BulkUploadRequest(
    [FromForm] string ContentType,
    [FromForm] string Title,
    [FromForm] string? Description,
    [FromForm] string? Date,
    [FromForm] string? Location,
    [FromForm] string? Source,
    [FromForm] string? Tags,
    [FromForm] int? AlbumId,
    [FromForm] IFormFileCollection? Files);
