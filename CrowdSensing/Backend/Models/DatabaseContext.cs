using Microsoft.EntityFrameworkCore;

namespace Backend.Models
{
    public class DatabaseContext : DbContext
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PositionCount>()
                .ToTable("PositionCount");

            modelBuilder.Entity<SenderTypeRange>()
                .ToTable("SenderTypeRange");

            modelBuilder.Entity<PositionCount>()
                .Property(p => p.Lat)
                .HasColumnName("lat")
                .HasColumnType("REAL");

            modelBuilder.Entity<PositionCount>()
                .Property(p => p.Long)
                .HasColumnName("long")
                .HasColumnType("REAL");

            modelBuilder.Entity<PositionCount>()
                .Property(p => p.SenderType)
                .HasColumnName("senderType")
                .HasMaxLength(10);

            modelBuilder.Entity<PositionCount>()
                .Property(p => p.DeviceCount)
                .HasColumnName("deviceCount");

            modelBuilder.Entity<PositionCount>()
                .Property(p => p.MeasureTime)
                .HasColumnName("measureTime");

            modelBuilder.Entity<SenderTypeRange>()
                .Property(s => s.SenderType)
                .HasColumnName("senderType")
                .HasMaxLength(10);

            modelBuilder.Entity<SenderTypeRange>()
                .Property(s => s.Range)
                .HasColumnName("range");

            modelBuilder.Entity<SenderTypeRange>()
                .HasOne<PositionCount>()
                .WithMany()
                .HasForeignKey(s => s.SenderType)
                .HasPrincipalKey(p => p.SenderType)
                .OnDelete(DeleteBehavior.Restrict);

            // Required so SenderType can be used as principal key for the configured FK.
            modelBuilder.Entity<PositionCount>()
                .HasAlternateKey(p => p.SenderType);
        }

        public DbSet<PositionCount> PositionCounts { get; set; } = null!;
        public DbSet<SenderTypeRange> SenderTypeRanges { get; set; } = null!;

        public DatabaseContext(DbContextOptions options) : base(options)
        {

        }
    }
}