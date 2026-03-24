using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;

namespace WyattFamily.Api.Controllers;

// ── Site Stats ────────────────────────────────────────────────────
[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly AppDbContext _db;
    public StatsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        return Ok(new {
            photos    = await _db.MediaItems.CountAsync(m => m.Type == MediaType.Photo    && (isAuth || !m.IsPrivate)),
            videos    = await _db.MediaItems.CountAsync(m => m.Type == MediaType.Video    && (isAuth || !m.IsPrivate)),
            documents = await _db.Documents.CountAsync(d => isAuth || !d.IsPrivate),
            stories   = await _db.Stories.CountAsync(s => isAuth || !s.IsPrivate),
            people    = await _db.People.CountAsync(p => isAuth || !p.IsPrivate),
        });
    }
}

// ── Recent activity (public homepage bar) ─────────────────────────
[ApiController]
[Route("api/recent")]
public class RecentController : ControllerBase
{
    private readonly AppDbContext _db;
    public RecentController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetRecent()
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var recentMedia = await _db.MediaItems
            .Where(m => isAuth || !m.IsPrivate)
            .OrderByDescending(m => m.CreatedAt)
            .Take(3)
            .Select(m => new { m.Id, title = m.Title, type = "photo", link = $"/photos/{m.AlbumId}" })
            .ToListAsync();

        var recentDocs = await _db.Documents
            .Where(d => isAuth || !d.IsPrivate)
            .OrderByDescending(d => d.CreatedAt)
            .Take(2)
            .Select(d => new { d.Id, title = d.Title, type = "document", link = $"/documents?id={d.Id}" })
            .ToListAsync();

        var recentStories = await _db.Stories
            .Where(s => isAuth || !s.IsPrivate)
            .OrderByDescending(s => s.CreatedAt)
            .Take(2)
            .Select(s => new { s.Id, title = s.Title, type = "story", link = $"/stories/{s.Id}" })
            .ToListAsync();

        var all = recentMedia.Cast<object>()
            .Concat(recentDocs)
            .Concat(recentStories)
            .Take(6);

        return Ok(all);
    }
}

// ── Tags ──────────────────────────────────────────────────────────
[ApiController]
[Route("api/tags")]
public class TagsController : ControllerBase
{
    private readonly AppDbContext _db;
    public TagsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetTags()
    {
        // Return distinct story topics as tags
        var topics = await _db.Stories
            .Where(s => s.Topic != null)
            .Select(s => s.Topic!)
            .Distinct()
            .ToListAsync();
        return Ok(topics);
    }
}

// ── Global search ─────────────────────────────────────────────────
[ApiController]
[Route("api/search")]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _db;
    public SearchController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(new { });
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var media = await _db.MediaItems
            .Where(m => (isAuth || !m.IsPrivate) &&
                (m.Title.Contains(q) || (m.Description != null && m.Description.Contains(q)) ||
                 (m.Location != null && m.Location.Contains(q))))
            .Take(10)
            .Select(m => new { m.Id, m.Title, m.DateDisplay, type = "media", link = $"/photos/{m.AlbumId}" })
            .ToListAsync();

        var documents = await _db.Documents
            .Where(d => (isAuth || !d.IsPrivate) &&
                (d.Title.Contains(q) || (d.Description != null && d.Description.Contains(q))))
            .Take(10)
            .Select(d => new { d.Id, d.Title, d.DateDisplay, type = "document", link = $"/documents?id={d.Id}" })
            .ToListAsync();

        var stories = await _db.Stories
            .Where(s => (isAuth || !s.IsPrivate) &&
                (s.Title.Contains(q) || s.Body.Contains(q) || (s.Excerpt != null && s.Excerpt.Contains(q))))
            .Take(10)
            .Select(s => new { s.Id, s.Title, s.DateDisplay, type = "story", link = $"/stories/{s.Id}" })
            .ToListAsync();

        var people = await _db.People
            .Where(p => (isAuth || !p.IsPrivate) &&
                (p.FirstName.Contains(q) || p.LastName.Contains(q) ||
                 (p.Bio != null && p.Bio.Contains(q))))
            .Take(10)
            .Select(p => new { p.Id, title = p.FirstName + " " + p.LastName, DateDisplay = p.BirthDate, type = "person", link = $"/tree?person={p.Id}" })
            .ToListAsync();

        return Ok(new { media, documents, stories, people, total = media.Count + documents.Count + stories.Count + people.Count });
    }
}
