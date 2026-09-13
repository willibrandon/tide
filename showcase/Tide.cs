namespace Tide.Showcase;

/// <summary>A reading with a stable, descriptive identity.</summary>
public sealed record Reading(string Station, double Height)
{
    public string Summarize() => $"{Station}: {Height:F2} m";
}

public static class Program
{
    public static void Main()
    {
        var reading = new Reading("North Cove", 1.72);
        System.Console.WriteLine(reading.Summarize());
    }
}
