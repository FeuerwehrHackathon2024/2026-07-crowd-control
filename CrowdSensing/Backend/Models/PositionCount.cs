namespace Backend.Models
{
    public class PositionCount
    {
        public int Id { get; set; }
        public double Lat { get; set; }
        public double Long { get; set; }
        public string SenderType { get; set; } = string.Empty;
        public int DeviceCount { get; set; }
        public DateTime MeasureTime { get; set; }
    }
}
