using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

namespace WyattFamily.Api.Controllers;

// ── Comments ─────────────────────────────────────────────────────
[ApiController]
[Route("api/comments")]
public class CommentsController : ControllerBase
{
    private readonly AppDbContext _db;
    public CommentsController(AppDbContext db) => _db = db;

    [Authorize]
    [HttpGet("{type}/{id:int}")]
    public async Task<IActionResult> GetComments(string type, int id)
    {
        var comments = await _db.Comments
            .Where(c => c.ArtifactType == type && c.ArtifactId == id)
            .Include(c => c.Author)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new {
                c.Id, c.Text, c.CreatedAt, c.UpdatedAt,
                c.AuthorId,
                authorName = c.Author.FirstName + " " + c.Author.LastName
            })
            .ToListAsync();
        return Ok(comments);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> PostComment([FromBody] PostCommentRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var comment = new Comment
        {
            AuthorId     = userId!,
            ArtifactType = req.ArtifactType,
            ArtifactId   = req.ArtifactId,
            Text         = req.Text
        };
        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();
        return Ok(new { comment.Id });
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentRequest req)
    {
        var comment = await _db.Comments.FindAsync(id);
        if (comment is null) return NotFound();
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (comment.AuthorId != userId && !User.IsInRole("admin")) return Forbid();
        comment.Text      = req.Text;
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _db.Comments.FindAsync(id);
        if (comment is null) return NotFound();
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (comment.AuthorId != userId && !User.IsInRole("admin")) return Forbid();
        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record PostCommentRequest(string ArtifactType, int ArtifactId, string Text);
public record UpdateCommentRequest(string Text);

// ── Submissions ──────────────────────────────────────────────────
[ApiController]
[Route("api/submissions")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly AppDbContext   _db;
    private readonly IBlobService   _blob;
    private readonly IEmailService  _email;
    private readonly IConfiguration _config;

    public SubmissionsController(AppDbContext db, IBlobService blob,
        IEmailService email, IConfiguration config)
    {
        _db = db; _blob = blob; _email = email; _config = config;
    }

    [HttpPost]
    [RequestSizeLimit(200_000_000)]
    public async Task<IActionResult> Submit([FromForm] SubmissionFormRequest req)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var user   = await _db.Users.FindAsync(userId);

        var submission = new Submission
        {
            SubmittedById = userId!,
            ContentType   = req.ContentType,
            Title         = req.Title,
            Description   = req.Description,
            DateDisplay   = req.Date,
            Location      = req.Location,
            People        = req.People,
            Tags          = req.Tags,
            Source        = req.Source,
        };
        _db.Submissions.Add(submission);
        await _db.SaveChangesAsync();

        // Upload files to staging container
        if (req.Files is not null)
        {
            foreach (var file in req.Files)
            {
                var key = $"submissions/{submission.Id}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                await using var stream = file.OpenReadStream();
                await _blob.UploadAsync(key, stream, file.ContentType, isPrivate: true, container: "SubmissionContainer");
                _db.SubmissionFiles.Add(new SubmissionFile {
                    SubmissionId = submission.Id, StorageKey = key,
                    FileName = file.FileName, ContentType = file.ContentType, FileSizeBytes = file.Length
                });
            }
            await _db.SaveChangesAsync();
        }

        // Notify admin
        var adminEmail = _config["Email:FromAddress"]!;
        await _email.SendAsync(adminEmail, $"New Submission: {req.Title}",
            $"<p>{user?.FirstName} {user?.LastName} submitted <strong>{req.Title}</strong> ({req.ContentType}).</p>" +
            $"<p><a href='{_config["Frontend:BaseUrl"]}/admin/submissions'>Review in Admin Panel</a></p>");

        return Ok(new { submission.Id });
    }

    // Member: view their own submissions
    [HttpGet("mine")]
    public async Task<IActionResult> MySubmissions()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var subs = await _db.Submissions
            .Where(s => s.SubmittedById == userId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new { s.Id, s.Title, s.ContentType, s.Status, s.SubmittedAt, s.RejectionReason })
            .ToListAsync();
        return Ok(subs);
    }
}

public record SubmissionFormRequest(
    string ContentType, string Title, string? Description,
    string? Date, string? Location, string? People, string? Tags, string? Source,
    IFormFileCollection? Files);

// ── Donations ────────────────────────────────────────────────────
[ApiController]
[Route("api/donations")]
public class DonationsController : ControllerBase
{
    private readonly AppDbContext   _db;
    private readonly IConfiguration _config;
    private readonly IEmailService  _email;

    public DonationsController(AppDbContext db, IConfiguration config, IEmailService email)
    {
        _db = db; _config = config; _email = email;
    }

    // Create Stripe payment intent
    [HttpPost("intent")]
    public IActionResult CreateIntent([FromBody] DonationIntentRequest req)
    {
        Stripe.StripeConfiguration.ApiKey = _config["Stripe:SecretKey"];
        var options = new Stripe.PaymentIntentCreateOptions
        {
            Amount   = (long)(req.Amount * 100),
            Currency = "usd",
            Metadata = new Dictionary<string, string>
            {
                { "donorName",    req.DonorName    ?? "" },
                { "donorMessage", req.DonorMessage ?? "" },
                { "isPublic",     req.IsPublic.ToString() }
            }
        };
        var service = new Stripe.PaymentIntentService();
        var intent  = service.Create(options);
        return Ok(new { clientSecret = intent.ClientSecret });
    }

    // Stripe webhook — called by Stripe on payment success
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        var json      = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];
        try
        {
            var stripeEvent = Stripe.EventUtility.ConstructEvent(
                json, signature, _config["Stripe:WebhookSecret"]);

            if (stripeEvent.Type == "payment_intent.succeeded")
            {
                var intent   = (Stripe.PaymentIntent)stripeEvent.Data.Object;
                var donation = new Donation
                {
                    Amount          = intent.Amount / 100m,
                    DonorName       = intent.Metadata.GetValueOrDefault("donorName"),
                    DonorMessage    = intent.Metadata.GetValueOrDefault("donorMessage"),
                    IsPublic        = intent.Metadata.GetValueOrDefault("isPublic") == "True",
                    StripePaymentId = intent.Id
                };
                _db.Donations.Add(donation);
                await _db.SaveChangesAsync();

                var adminEmail = _config["Email:FromAddress"]!;
                await _email.SendAsync(adminEmail, "New Donation Received",
                    $"<p>A donation of <strong>${donation.Amount:F2}</strong> was received" +
                    (donation.DonorName != null ? $" from {donation.DonorName}" : "") + ".</p>");
            }
            return Ok();
        }
        catch (Stripe.StripeException) { return BadRequest(); }
    }

    // Public: get donor thank-you list
    [HttpGet("public")]
    public async Task<IActionResult> GetPublicDonors()
    {
        var donors = await _db.Donations
            .Where(d => d.IsPublic && d.DonorName != null)
            .OrderByDescending(d => d.CreatedAt)
            .Take(50)
            .Select(d => new { d.DonorName, d.DonorMessage, d.Amount, d.CreatedAt })
            .ToListAsync();
        return Ok(donors);
    }
}

public record DonationIntentRequest(decimal Amount, string? DonorName, string? DonorMessage, bool IsPublic);
