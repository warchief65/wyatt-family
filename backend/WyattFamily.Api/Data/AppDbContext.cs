using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WyattFamily.Api.Models;

namespace WyattFamily.Api.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Person>         People      { get; set; }
    public DbSet<Album>          Albums      { get; set; }
    public DbSet<MediaItem>      MediaItems  { get; set; }
    public DbSet<Document>       Documents   { get; set; }
    public DbSet<Story>          Stories     { get; set; }
    public DbSet<ContentTag>     ContentTags { get; set; }
    public DbSet<Comment>        Comments    { get; set; }
    public DbSet<Submission>     Submissions { get; set; }
    public DbSet<SubmissionFile> SubmissionFiles { get; set; }
    public DbSet<Donation>       Donations   { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<MediaItem>()
            .HasOne(m => m.Album)
            .WithMany(a => a.Items)
            .HasForeignKey(m => m.AlbumId);

        builder.Entity<Comment>()
            .HasOne(c => c.Author)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.AuthorId);

        builder.Entity<Submission>()
            .HasOne(s => s.SubmittedBy)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.SubmittedById);

        builder.Entity<ContentTag>()
            .HasOne(ct => ct.Person)
            .WithMany(p => p.ContentTags)
            .HasForeignKey(ct => ct.PersonId);

        builder.Entity<Donation>()
            .Property(d => d.Amount)
            .HasPrecision(10, 2);
    }
}
