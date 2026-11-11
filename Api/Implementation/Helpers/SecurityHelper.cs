using System.Net;
using System.Text.RegularExpressions;

namespace Implementation.Helpers;

public static class SecurityHelper
{
    private static readonly Regex ScriptTagRegex = new(@"<script[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    /// <summary>
    /// Sanitizes plain user input strings to prevent XSS attacks.
    /// </summary>
    public static string? SanitizeText(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        // Strip dangerous script tags completely
        var sanitized = ScriptTagRegex.Replace(input, string.Empty);

        // HTML encode any remaining characters
        return WebUtility.HtmlEncode(sanitized.Trim());
    }

    /// <summary>
    /// Strips all HTML tags from an input string for pure plain text fields.
    /// </summary>
    public static string? StripHtml(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input;
        }

        var stripped = HtmlTagRegex.Replace(input, string.Empty);
        return stripped.Trim();
    }
}

