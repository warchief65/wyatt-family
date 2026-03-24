using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/people")]
public class PeopleController : ControllerBase
{
    private readonly AppDbContext _db;
    public PeopleController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetPeople([FromQuery] string? q, [FromQuery] int limit = 100)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var query = _db.People.AsQueryable();
        if (!isAuth) query = query.Where(p => !p.IsPrivate);
        if (!string.IsNullOrEmpty(q))
            query = query.Where(p => p.FirstName.Contains(q) || p.LastName.Contains(q));

        var people = await query
            .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .Take(limit)
            .Select(p => new {
                p.Id, p.FirstName, p.LastName, p.BirthDate, p.DeathDate,
                p.BirthPlace, p.ThumbnailUrl, p.IsPrivate,
                name = p.FirstName + " " + p.LastName
            })
            .ToListAsync();

        return Ok(people);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPerson(int id)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var person = await _db.People
            .Where(p => p.Id == id && (isAuth || !p.IsPrivate))
            .FirstOrDefaultAsync();

        if (person is null)
            return isAuth ? NotFound() : Unauthorized();

        // Related content counts
        var mediaCount = await _db.ContentTags
            .CountAsync(ct => ct.PersonId == id && ct.ContentType == "media");
        var docCount = await _db.ContentTags
            .CountAsync(ct => ct.PersonId == id && ct.ContentType == "document");
        var storyCount = await _db.ContentTags
            .CountAsync(ct => ct.PersonId == id && ct.ContentType == "story");

        // Parents
        Person? father = person.FatherId.HasValue ? await _db.People.FindAsync(person.FatherId) : null;
        Person? mother = person.MotherId.HasValue ? await _db.People.FindAsync(person.MotherId) : null;

        return Ok(new {
            person.Id, person.FirstName, person.LastName, person.BirthDate,
            person.DeathDate, person.BirthPlace, person.Bio, person.ThumbnailUrl,
            person.IsPrivate, person.FatherId, person.MotherId,
            fatherName = father is null ? null : father.FirstName + " " + father.LastName,
            motherName = mother is null ? null : mother.FirstName + " " + mother.LastName,
            mediaCount, docCount, storyCount
        });
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var people = await _db.People
            .Select(p => new {
                p.Id, p.FirstName, p.LastName, p.BirthDate, p.DeathDate,
                p.FatherId, p.MotherId, p.ThumbnailUrl,
                isPrivate = p.IsPrivate,
                // Replace private living persons with placeholder
                displayName = (!isAuth && p.IsPrivate) ? "Living" : p.FirstName + " " + p.LastName
            })
            .ToListAsync();

        return Ok(people);
    }

    [Authorize(Roles = "admin")]
    [HttpPost]
    public async Task<IActionResult> CreatePerson([FromBody] PersonRequest req)
    {
        var person = new Person {
            FirstName  = req.FirstName,
            LastName   = req.LastName,
            BirthDate  = req.BirthDate,
            DeathDate  = req.DeathDate,
            BirthPlace = req.BirthPlace,
            Bio        = req.Bio,
            IsPrivate  = req.IsPrivate,
            FatherId   = req.FatherId,
            MotherId   = req.MotherId
        };
        _db.People.Add(person);
        await _db.SaveChangesAsync();
        return Ok(new { person.Id });
    }

    [Authorize(Roles = "admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePerson(int id, [FromBody] PersonRequest req)
    {
        var person = await _db.People.FindAsync(id);
        if (person is null) return NotFound();

        person.FirstName  = req.FirstName;  person.LastName   = req.LastName;
        person.BirthDate  = req.BirthDate;  person.DeathDate  = req.DeathDate;
        person.BirthPlace = req.BirthPlace; person.Bio        = req.Bio;
        person.IsPrivate  = req.IsPrivate;  person.FatherId   = req.FatherId;
        person.MotherId   = req.MotherId;

        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record PersonRequest(
    string FirstName, string LastName,
    string? BirthDate, string? DeathDate, string? BirthPlace,
    string? Bio, bool IsPrivate, int? FatherId, int? MotherId);
