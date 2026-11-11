using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Implementation.Helpers;

public static class SecurityHelper
{
    private static readonly Regex ScriptTagRegex = new(@"<script[^>]*>[\s\S]*?</script>", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex HtmlTagRegex = new(@"<[^>]+>", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // Default 256-bit AES master key derived via SHA-256 (overridable via Initialize)
    private static byte[] _masterKey = SHA256.HashData(Encoding.UTF8.GetBytes("CustomerSupportSystem_SuperSecretKey_2026!@#$%^&*()_+SecureKey12345"));

    /// <summary>
    /// Initializes master encryption key from configuration.
    /// </summary>
    public static void Initialize(string? secretKey)
    {
        if (!string.IsNullOrWhiteSpace(secretKey))
        {
            _masterKey = SHA256.HashData(Encoding.UTF8.GetBytes(secretKey));
        }
    }

    /// <summary>
    /// Encrypts a plain text string (e.g. permission or sensitive payload) using AES-256-CBC with a random IV.
    /// Returns Base64-encoded [16-byte IV + CipherText].
    /// </summary>
    public static string Encrypt(string? plainText)
    {
        if (string.IsNullOrEmpty(plainText))
        {
            return plainText ?? string.Empty;
        }

        using var aes = Aes.Create();
        aes.Key = _masterKey;
        aes.GenerateIV();
        var iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, iv);
        using var ms = new MemoryStream();
        ms.Write(iv, 0, iv.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs, Encoding.UTF8))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    /// <summary>
    /// Decrypts a Base64-encoded [16-byte IV + CipherText] using AES-256-CBC.
    /// </summary>
    public static string Decrypt(string? cipherText)
    {
        if (string.IsNullOrWhiteSpace(cipherText))
        {
            return cipherText ?? string.Empty;
        }

        var fullBytes = Convert.FromBase64String(cipherText.Trim());
        if (fullBytes.Length < 17)
        {
            throw new FormatException("Cipher text is invalid or corrupted.");
        }

        var iv = new byte[16];
        Array.Copy(fullBytes, 0, iv, 0, 16);

        var cipherBytes = new byte[fullBytes.Length - 16];
        Array.Copy(fullBytes, 16, cipherBytes, 0, cipherBytes.Length);

        using var aes = Aes.Create();
        aes.Key = _masterKey;
        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipherBytes);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs, Encoding.UTF8);

        return sr.ReadToEnd();
    }

    /// <summary>
    /// Safely decrypts input if encrypted (Base64 AES); falls back to raw string if already plain text.
    /// Useful for passwords and permissions supplied in request payloads.
    /// </summary>
    public static string DecryptIfEncrypted(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return input ?? string.Empty;
        }

        try
        {
            return Decrypt(input);
        }
        catch
        {
            // Fallback to input if not encrypted or invalid cipher
            return input.Trim();
        }
    }

    /// <summary>
    /// Encrypts an entire list of strings (e.g. permissions list).
    /// </summary>
    public static List<string> EncryptList(IEnumerable<string>? items)
    {
        if (items == null)
        {
            return new List<string>();
        }

        return items.Select(Encrypt).ToList();
    }

    /// <summary>
    /// Decrypts an entire list of strings (e.g. incoming permissions list).
    /// </summary>
    public static List<string> DecryptList(IEnumerable<string>? items)
    {
        if (items == null)
        {
            return new List<string>();
        }

        return items.Select(DecryptIfEncrypted).ToList();
    }

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
