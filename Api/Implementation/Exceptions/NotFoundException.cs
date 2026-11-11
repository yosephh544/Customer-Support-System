using System.Net;

namespace Implementation.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string message)
        : base(message, HttpStatusCode.NotFound)
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} with key '{key}' was not found.", HttpStatusCode.NotFound)
    {
    }
}

