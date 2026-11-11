using System.Net;

namespace Implementation.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to access this resource.")
        : base(message, HttpStatusCode.Forbidden)
    {
    }
}

