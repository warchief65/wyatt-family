using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Data;
using WyattFamily.Api.Models;
using WyattFamily.Api.Services;

namespace WyattFamily.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly AppDbContext   _db;
    private readonly IBlobService   _blob;
    private readonly IConfiguration _config;

    public MediaController(AppDbContext db, IBlobService blob, IConfiguration config)
    {
        _db = db; _blob = blob; _config = config;
    }

    // GET /api/media/albums
    [HttpGet("albums")]
    public async Task<IActionResult> GetAlbums([FromQuery] string? q, [FromQuery] string? person,
        [FromQuery] string? tag, [FromQuery] int? from, [FromQuery] int? to)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var query = _db.Albums.AsQueryable();
        if (!isAuth) query = query.Where(a => !a.IsPrivate);
        if (!string.IsNullOrEmpty(q)) query = query.Where(a => a.Title.Contains(q) || (a.Description != null && a.Description.Contains(q)));
        if (from.HasValue) query = query.Where(a => a.Items.Any(i => i.Year >= from));
        if (to.HasValue)   query = query.Where(a => a.Items.Any(i => i.Year <= to));

        var albums = await query
            .Select(a => new {
                a.Id, a.Title, a.Description, a.Branch, a.DateDisplay, a.Location, a.IsPrivate,
                CoverUrl   = a.CoverUrl,
                ItemCount  = a.Items.Count(i => isAuth || !i.IsPrivate)
            })
            .OrderByDescending(a => a.Id)
            .ToListAsync();

        return Ok(albums);
    }

    // GET /api/media/albums/:id
    [HttpGet("albums/{id:int}")]
    public async Task<IActionResult> GetAlbum(int id)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var album = await _db.Albums
            .Include(a => a.Items.Where(i => isAuth || !i.IsPrivate))
            .FirstOrDefaultAsync(a => a.Id == id && (isAuth || !a.IsPrivate));

        if (album is null) return NotFound();

        var items = album.Items.Select(i => new {
            i.Id, i.Title, i.Description, i.DateDisplay, i.Location, i.IsPrivate,
            type = i.Type.ToString().ToLower(), thumbnailUrl = _blob.GetUrl(i.ThumbnailKey, i.IsPrivate),
            url = _blob.GetUrl(i.StorageKey, i.IsPrivate),
            People = _db.ContentTags
                .Where(ct => ct.ContentType == "media" && ct.ContentId == i.Id)
                .Select(ct => ct.Person.FirstName + " " + ct.Person.LastName)
                .ToList()
        });

        return Ok(new {
            album.Id, album.Title, album.Description, album.Branch,
            album.DateDisplay, album.Location, album.IsPrivate,
            Items = items
        });
    }

    // GET /api/media/recent
    [HttpGet("recent")]
    public async Task<IActionResult> GetRecent([FromQuery] int limit = 12)
    {
        bool isAuth = User.Identity?.IsAuthenticated == true;

        var items = await _db.MediaItems
            .Where(i => isAuth || !i.IsPrivate)
            .OrderByDescending(i => i.CreatedAt)
            .Take(limit)
            .Select(i => new {
                i.Id, i.Title, i.DateDisplay, i.Location, i.IsPrivate,
                type = i.Type.ToString().ToLower(),
                thumbnailUrl = i.ThumbnailKey != null ? _blob.GetUrl(i.ThumbnailKey, i.IsPrivate) : null,
                People = _db.ContentTags
                    .Where(ct => ct.ContentType == "media" && ct.ContentId == i.Id)
                    .Select(ct => ct.Person.FirstName + " " + ct.Person.LastName)
                    .ToList()
            })
            .ToListAsync();

        return Ok(items);
    }

    // POST /api/media/albums  (admin only)
    [Authorize(Roles = "admin")]
    [HttpPost("albums")]
    public async Task<IActionResult> CreateAlbum([FromBody] dynamic body)
    {
        var album = new Album { Title = (string)body.title, Description = (string?)body.description };
        _db.Albums.Add(album);
        await _db.SaveChangesAsync();
        return Ok(album);
    }

    // POST /api/media/upload  (admin only)
    [Authorize(Roles = "admin")]
    [HttpPost("upload")]
    [RequestSizeLimit(500_000_000)] // 500MB
    public async Task<IActionResult> Upload([FromForm] int albumId, [FromForm] IFormFileCollection files)
    {
        var album = await _db.Albums.FindAsync(albumId);
        if (album is null) return NotFound();

        var results = new List<object>();
        foreach (var file in files)
        {
            var isVideo = file.ContentType.StartsWith("video/");
            var key     = $"albums/{albumId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            await using var stream = file.OpenReadStream();
            await _blob.UploadAsync(key, stream, file.ContentType, album.IsPrivate);

            var item = new MediaItem
            {
                AlbumId    = albumId,
                Title      = Path.GetFileNameWithoutExtension(file.FileName),
                StorageKey = key,
                Type       = isVideo ? MediaType.Video : MediaType.Photo,
                FileSizeBytes = file.Length
            };
            _db.MediaItems.Add(item);
            results.Add(new { item.Id, item.Title });
        }

        await _db.SaveChangesAsync();
        return Ok(results);
    }

    // PATCH /api/media/:id/privacy
    [Authorize(Roles = "admin")]
    [HttpPatch("{id:int}/privacy")]
    public async Task<IActionResult> SetPrivacy(int id, [FromBody] PrivacyRequest req)
    {
        var item = await _db.MediaItems.FindAsync(id);
        if (item is null) return NotFound();
        item.IsPrivate = req.IsPrivate;
        await _db.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/media/:id  (admin only — single media item)
    [Authorize(Roles = "admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteMediaItem(int id)
    {
        var item = await _db.MediaItems.FindAsync(id);
        if (item is null) return NotFound();

        await _blob.DeleteAsync(item.StorageKey, item.IsPrivate);
        if (item.ThumbnailKey != null)
            await _blob.DeleteAsync(item.ThumbnailKey, item.IsPrivate);

        _db.MediaItems.Remove(item);
        await _db.SaveChangesAsync();
        return Ok();
    }

    // DELETE /api/media/albums/:id  (admin only — album + all items + blobs)
    [Authorize(Roles = "admin")]
    [HttpDelete("albums/{id:int}")]
    public async Task<IActionResult> DeleteAlbum(int id)
    {
        var album = await _db.Albums
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (album is null) return NotFound();

        foreach (var item in album.Items)
        {
            await _blob.DeleteAsync(item.StorageKey, item.IsPrivate);
            if (item.ThumbnailKey != null)
                await _blob.DeleteAsync(item.ThumbnailKey, item.IsPrivate);
        }

        _db.MediaItems.RemoveRange(album.Items);
        _db.Albums.Remove(album);
        await _db.SaveChangesAsync();
        return Ok();
    }
}

public record PrivacyRequest(bool IsPrivate);
