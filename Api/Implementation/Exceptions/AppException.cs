using System.Net;

namespace Implementation.Exceptions;

public abstract class AppException : Exception
{
    public HttpStatusCode StatusCode { get; }
    public IReadOnlyList<string> Errors { get; }

    protected AppException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest, IEnumerable<string>? errors = null)
        : base(message)
    {
        StatusCode = statusCode;
        Errors = errors?.ToList() ?? new List<string>();
    }
}

