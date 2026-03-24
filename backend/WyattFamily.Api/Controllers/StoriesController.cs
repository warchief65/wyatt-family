using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/stories")]
public class StoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public StoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetStories(
        [FromQuery] string? q, [FromQuery] string? topic,
        [FromQuery] int? personId, [FromQuery] int limit = 20, [FromQuery] int skip = 0)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var query = _db.Stories.AsQueryable();

        if (!isAuth) query = query.Where(s => !s.IsPrivate);
        if (!string.IsNullOrEmpty(q))
            query = query.Where(s => s.Title.Contains(q) || s.Body.Contains(q) || (s.Excerpt != null && s.Excerpt.Contains(q)));
        if (!string.IsNullOrEmpty(topic))
            query = query.Where(s => s.Topic == topic);
        if (personId.HasValue)
            query = query.Where(s => s.ContentTags.Any(ct => ct.PersonId == personId && ct.ContentType == "story"));

        var stories = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip(skip).Take(limit)
            .Select(s => new {
                s.Id, s.Title, s.Excerpt, s.Topic, s.DateDisplay, s.IsPrivate, s.CreatedAt,
                People = s.ContentTags
                    .Where(ct => ct.ContentType == "story")
                    .Select(ct => ct.Person.FirstName + " " + ct.Person.LastName)
                    .ToList()
            })
            .ToListAsync();

        return Ok(stories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetStory(int id)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var story = await _db.Stories
            .Where(s => s.Id == id && (isAuth || !s.IsPrivate))
            .Select(s => new {
                s.Id, s.Title, s.Body, s.Excerpt, s.Topic, s.DateDisplay, s.IsPrivate, s.CreatedAt,
                People = s.ContentTags
                    .Where(ct => ct.ContentType == "story")
                    .Select(ct => new { ct.Person.Id, Name = ct.Person.FirstName + " " + ct.Person.LastName })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (story is null) return NotFound();
        return Ok(story);
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> CreateStory([FromBody] StoryRequest req)
    {
        var story = new Story {
            Title       = req.Title,
            Body        = req.Body,
            Excerpt     = req.Excerpt ?? req.Body[..Math.Min(200, req.Body.Length)],
            Topic       = req.Topic,
            DateDisplay = req.DateDisplay,
            IsPrivate   = req.IsPrivate
        };
        _db.Stories.Add(story);
        await _db.SaveChangesAsync();
        return Ok(new { story.Id });
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStory(int id, [FromBody] StoryRequest req)
    {
        var story = await _db.Stories.FindAsync(id);
        if (story is null) return NotFound();
        story.Title = req.Title; story.Body = req.Body;
        story.Topic = req.Topic; story.DateDisplay = req.DateDisplay;
        story.IsPrivate = req.IsPrivate;
        if (req.Excerpt != null) story.Excerpt = req.Excerpt;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteStory(int id)
    {
        var story = await _db.Stories.FindAsync(id);
        if (story is null) return NotFound();
        _db.Stories.Remove(story);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record StoryRequest(string Title, string Body, string? Excerpt,
    string? Topic, string? DateDisplay, bool IsPrivate);
