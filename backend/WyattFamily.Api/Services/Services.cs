using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using MailKit.Net.Smtp;
using MimeKit;

namespace WyattFamily.Api.Services;

// ── Email ─────────────────────────────────────────────────────────
public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody);
}

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_config["Email:FromName"], _config["Email:FromAddress"]));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body    = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_config["Email:SmtpHost"], int.Parse(_config["Email:SmtpPort"] ?? "587"),
                MailKit.Security.SecureSocketOptions.StartTls);

            if (!string.IsNullOrEmpty(_config["Email:Username"]))
                await client.AuthenticateAsync(_config["Email:Username"], _config["Email:Password"]);

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} with subject {Subject}", to, subject);
        }
    }
}

// ── Blob Storage ──────────────────────────────────────────────────
public interface IBlobService
{
    Task UploadAsync(string key, Stream data, string contentType, bool isPrivate, string container = "PublicContainer");
    Task DeleteAsync(string key, bool isPrivate);
    string GetUrl(string? key, bool isPrivate);
    Task<string> GetSignedUrlAsync(string key, TimeSpan expiry);
}

public class AzureBlobService : IBlobService
{
    private readonly IConfiguration _config;

    public AzureBlobService(IConfiguration config) => _config = config;

    private BlobContainerClient GetContainer(bool isPrivate, string configKey = "PublicContainer")
    {
        var conn      = _config["Azure:BlobStorage:ConnectionString"]!;
        var container = isPrivate
            ? _config["Azure:BlobStorage:PrivateContainer"]!
            : _config[$"Azure:BlobStorage:{configKey}"]!;
        return new BlobContainerClient(conn, container);
    }

    public async Task UploadAsync(string key, Stream data, string contentType,
        bool isPrivate, string container = "PublicContainer")
    {
        var client = GetContainer(isPrivate, container).GetBlobClient(key);
        await client.UploadAsync(data, new BlobHttpHeaders { ContentType = contentType });
    }

    public async Task DeleteAsync(string key, bool isPrivate)
    {
        var client = GetContainer(isPrivate).GetBlobClient(key);
        await client.DeleteIfExistsAsync();
    }

    public string GetUrl(string? key, bool isPrivate)
    {
        if (key is null) return "";
        if (!isPrivate)
        {
            var conn = _config["Azure:BlobStorage:ConnectionString"]!;
            var container = _config["Azure:BlobStorage:PublicContainer"]!;
            return $"https://{new BlobServiceClient(conn).AccountName}.blob.core.windows.net/{container}/{key}";
        }
        // Private items: return empty — use GetSignedUrlAsync when rendering
        return "";
    }

    public Task<string> GetSignedUrlAsync(string key, TimeSpan expiry)
    {
        var conn      = _config["Azure:BlobStorage:ConnectionString"]!;
        var container = _config["Azure:BlobStorage:PrivateContainer"]!;
        var client    = new BlobClient(conn, container, key);
        var sas       = client.GenerateSasUri(Azure.Storage.Sas.BlobSasPermissions.Read,
            DateTimeOffset.UtcNow.Add(expiry));
        return Task.FromResult(sas.ToString());
    }
}

// ── Local Filesystem Blob Storage (Development) ──────────────────
public class LocalFileBlobService : IBlobService
{
    private readonly string _root;
    private readonly ILogger<LocalFileBlobService> _logger;

    public LocalFileBlobService(IWebHostEnvironment env, ILogger<LocalFileBlobService> logger)
    {
        _root = Path.Combine(env.ContentRootPath, "dev-blobs");
        _logger = logger;
    }

    public async Task UploadAsync(string key, Stream data, string contentType,
        bool isPrivate, string container = "PublicContainer")
    {
        var path = Path.Combine(_root, key.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var fs = File.Create(path);
        await data.CopyToAsync(fs);
        _logger.LogInformation("Dev blob saved: {Path}", path);
    }

    public Task DeleteAsync(string key, bool isPrivate)
    {
        var path = Path.Combine(_root, key.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public string GetUrl(string? key, bool isPrivate)
    {
        if (key is null) return "";
        return $"/dev-blobs/{key}";
    }

    public Task<string> GetSignedUrlAsync(string key, TimeSpan expiry)
    {
        return Task.FromResult($"/dev-blobs/{key}");
    }
}
