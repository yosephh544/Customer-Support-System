using System.Net;

namespace Implementation.Exceptions;

public class ValidationException : AppException
{
    public IDictionary<string, string[]> Failures { get; }

    public ValidationException(IDictionary<string, string[]> failures)
        : base("One or more validation failures have occurred.", HttpStatusCode.UnprocessableEntity, failures.SelectMany(f => f.Value))
    {
        Failures = failures;
    }

    public ValidationException(string field, string error)
        : base(error, HttpStatusCode.UnprocessableEntity, new[] { error })
    {
        Failures = new Dictionary<string, string[]>
        {
            { field, new[] { error } }
        };
    }
}

