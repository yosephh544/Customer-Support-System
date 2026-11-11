using System.Net;

namespace Implementation.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException(string message, IEnumerable<string>? errors = null)
        : base(message, HttpStatusCode.BadRequest, errors)
    {
    }
}

