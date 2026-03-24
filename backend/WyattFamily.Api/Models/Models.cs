using Microsoft.AspNetCore.Identity;

namespace WyattFamily.Api.Models;

// ── Identity ──────────────────────────────────────────────────────
public class AppUser : IdentityUser
{
    public string FirstName    { get; set; } = "";
    public string LastName     { get; set; } = "";
    public string Relation     { get; set; } = "";   // How related to the family
    public UserStatus Status   { get; set; } = UserStatus.Pending;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<Comment>    Comments    { get; set; } = new List<Comment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}

public enum UserStatus { Pending, Approved, Inactive, Rejected }

// ── Family Tree Person ────────────────────────────────────────────
public class Person
{
    public int     Id          { get; set; }
    public string  FirstName   { get; set; } = "";
    public string  LastName    { get; set; } = "";
    public string? BirthDate   { get; set; }
    public string? DeathDate   { get; set; }
    public string? BirthPlace  { get; set; }
    public string? Bio         { get; set; }
    public string? ThumbnailUrl{ get; set; }
    public bool    IsPrivate   { get; set; } = false;
    public int?    FatherId    { get; set; }
    public int?    MotherId    { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<ContentTag> ContentTags { get; set; } = new List<ContentTag>();
}

// ── Media ─────────────────────────────────────────────────────────
public class Album
{
    public int     Id          { get; set; }
    public string  Title       { get; set; } = "";
    public string? Description { get; set; }
    public string? Branch      { get; set; }   // Family branch
    public string? DateDisplay { get; set; }
    public string? Location    { get; set; }
    public string? CoverUrl    { get; set; }
    public bool    IsPrivate   { get; set; } = false;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<MediaItem> Items { get; set; } = new List<MediaItem>();
}

public class MediaItem
{
    public int       Id           { get; set; }
    public int       AlbumId      { get; set; }
    public Album     Album        { get; set; } = null!;
    public MediaType Type         { get; set; }
    public string    Title        { get; set; } = "";
    public string?   Description  { get; set; }
    public string    StorageKey   { get; set; } = "";  // Blob storage key
    public string?   ThumbnailKey { get; set; }
    public string?   DateDisplay  { get; set; }
    public string?   DatePrecision{ get; set; }
    public int?      Year         { get; set; }
    public string?   Location     { get; set; }
    public string?   Source       { get; set; }
    public bool      IsPrivate    { get; set; } = false;
    public long      FileSizeBytes{ get; set; }
    public DateTime  CreatedAt    { get; set; } = DateTime.UtcNow;
    public ICollection<ContentTag> ContentTags { get; set; } = new List<ContentTag>();
    public ICollection<Comment>    Comments    { get; set; } = new List<Comment>();
}

public enum MediaType { Photo, Video }

// ── Documents ────────────────────────────────────────────────────
public class Document
{
    public int          Id           { get; set; }
    public string       Title        { get; set; } = "";
    public string?      Description  { get; set; }
    public DocumentType DocType      { get; set; }
    public string       StorageKey   { get; set; } = "";
    public string?      DateDisplay  { get; set; }
    public int?         Year         { get; set; }
    public string?      Location     { get; set; }
    public string?      Source       { get; set; }
    public bool         IsPrivate    { get; set; } = false;
    public DateTime     CreatedAt    { get; set; } = DateTime.UtcNow;
    public ICollection<ContentTag> ContentTags { get; set; } = new List<ContentTag>();
    public ICollection<Comment>    Comments    { get; set; } = new List<Comment>();
}

public enum DocumentType
{
    BirthCertificate, DeathCertificate, MarriageLicense,
    Letter, LandDeed, CensusRecord, MilitaryRecord,
    Photograph, Newspaper, Other
}

// ── Stories ──────────────────────────────────────────────────────
public class Story
{
    public int     Id          { get; set; }
    public string  Title       { get; set; } = "";
    public string  Body        { get; set; } = "";  // Rich text HTML
    public string? Excerpt     { get; set; }
    public string? DateDisplay { get; set; }
    public string? Topic       { get; set; }
    public bool    IsPrivate   { get; set; } = false;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
    public ICollection<ContentTag> ContentTags { get; set; } = new List<ContentTag>();
    public ICollection<Comment>    Comments    { get; set; } = new List<Comment>();
}

// ── Content Tags (many-to-many: content ↔ person) ─────────────────
public class ContentTag
{
    public int    Id           { get; set; }
    public int    PersonId     { get; set; }
    public Person Person       { get; set; } = null!;
    public string ContentType  { get; set; } = "";  // "media", "document", "story"
    public int    ContentId    { get; set; }
}

// ── Comments ─────────────────────────────────────────────────────
public class Comment
{
    public int      Id           { get; set; }
    public string   AuthorId     { get; set; } = "";
    public AppUser  Author       { get; set; } = null!;
    public string   ArtifactType { get; set; } = "";  // "media", "document", "story"
    public int      ArtifactId   { get; set; }
    public string   Text         { get; set; } = "";
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt   { get; set; }
}

// ── Submissions ──────────────────────────────────────────────────
public class Submission
{
    public int              Id              { get; set; }
    public string           SubmittedById   { get; set; } = "";
    public AppUser          SubmittedBy     { get; set; } = null!;
    public string           ContentType     { get; set; } = "";
    public string           Title           { get; set; } = "";
    public string?          Description     { get; set; }
    public string?          DateDisplay     { get; set; }
    public string?          Location        { get; set; }
    public string?          People          { get; set; }
    public string?          Tags            { get; set; }
    public string?          Source          { get; set; }
    public SubmissionStatus Status          { get; set; } = SubmissionStatus.Pending;
    public string?          RejectionReason { get; set; }
    public DateTime         SubmittedAt     { get; set; } = DateTime.UtcNow;
    public DateTime?        ReviewedAt      { get; set; }
    public ICollection<SubmissionFile> Files { get; set; } = new List<SubmissionFile>();
}

public class SubmissionFile
{
    public int    Id           { get; set; }
    public int    SubmissionId { get; set; }
    public string StorageKey   { get; set; } = "";
    public string FileName     { get; set; } = "";
    public string ContentType  { get; set; } = "";
    public long   FileSizeBytes{ get; set; }
}

public enum SubmissionStatus { Pending, Approved, Rejected }

// ── Donations ────────────────────────────────────────────────────
public class Donation
{
    public int      Id              { get; set; }
    public decimal  Amount          { get; set; }
    public string?  DonorName       { get; set; }
    public string?  DonorMessage    { get; set; }
    public bool     IsPublic        { get; set; } = false;
    public string   StripePaymentId { get; set; } = "";
    public DateTime CreatedAt       { get; set; } = DateTime.UtcNow;
}
