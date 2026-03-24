using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IBlobService _blob;
    public DocumentsController(AppDbContext db, IBlobService blob) { _db = db; _blob = blob; }

    [HttpGet]
    public async Task<IActionResult> GetDocuments(
        [FromQuery] string? q, [FromQuery] string? type,
        [FromQuery] int? personId, [FromQuery] int limit = 20, [FromQuery] int skip = 0)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var query = _db.Documents.AsQueryable();

        if (!isAuth) query = query.Where(d => !d.IsPrivate);
        if (!string.IsNullOrEmpty(q))
            query = query.Where(d => d.Title.Contains(q) || (d.Description != null && d.Description.Contains(q)));
        if (!string.IsNullOrEmpty(type) && Enum.TryParse<DocumentType>(type, true, out var dt))
            query = query.Where(d => d.DocType == dt);
        if (personId.HasValue)
            query = query.Where(d => d.ContentTags.Any(ct => ct.PersonId == personId && ct.ContentType == "document"));

        var docs = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip(skip).Take(limit)
            .Select(d => new {
                d.Id, d.Title, d.Description, d.IsPrivate, d.DateDisplay, d.Location, d.Source,
                type = d.DocType.ToString(),
                People = d.ContentTags
                    .Where(ct => ct.ContentType == "document")
                    .Select(ct => ct.Person.FirstName + " " + ct.Person.LastName)
                    .ToList()
            })
            .ToListAsync();

        return Ok(docs);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDocument(int id)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;
        var doc = await _db.Documents
            .Where(d => d.Id == id && (isAuth || !d.IsPrivate))
            .FirstOrDefaultAsync();

        if (doc is null) return NotFound();

        var url = doc.IsPrivate
            ? await _blob.GetSignedUrlAsync(doc.StorageKey, TimeSpan.FromMinutes(15))
            : _blob.GetUrl(doc.StorageKey, false);

        return Ok(new {
            doc.Id, doc.Title, doc.Description, doc.IsPrivate,
            doc.DateDisplay, doc.Location, doc.Source,
            type = doc.DocType.ToString(),
            url,
            People = await _db.ContentTags
                .Where(ct => ct.ContentType == "document" && ct.ContentId == id)
                .Select(ct => ct.Person.FirstName + " " + ct.Person.LastName)
                .ToListAsync()
        });
    }

    [Authorize(Roles = "admin")]
    [HttpPost("upload")]
    [RequestSizeLimit(100_000_000)]
    public async Task<IActionResult> Upload([FromForm] UploadDocumentRequest req)
    {
        var key = $"documents/{Guid.NewGuid()}{Path.GetExtension(req.File.FileName)}";
        await using var stream = req.File.OpenReadStream();
        await _blob.UploadAsync(key, stream, req.File.ContentType, req.IsPrivate);

        var doc = new Document {
            Title       = req.Title,
            Description = req.Description,
            DocType     = Enum.Parse<DocumentType>(req.DocType, true),
            StorageKey  = key,
            DateDisplay = req.DateDisplay,
            Location    = req.Location,
            Source      = req.Source,
            IsPrivate   = req.IsPrivate
        };
        _db.Documents.Add(doc);
        await _db.SaveChangesAsync();
        return Ok(new { doc.Id });
    }

    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var doc = await _db.Documents.FindAsync(id);
        if (doc is null) return NotFound();
        await _blob.DeleteAsync(doc.StorageKey, doc.IsPrivate);
        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record UploadDocumentRequest(
    [FromForm] IFormFile File,
    [FromForm] string Title,
    [FromForm] string DocType,
    [FromForm] string? Description,
    [FromForm] string? DateDisplay,
    [FromForm] string? Location,
    [FromForm] string? Source,
    [FromForm] bool IsPrivate);
