const SENSITIVE_KEYS = Object.freeze(['x-amz-credential', 'x-amz-signature', 'Signature', 'AWSAccessKeyId'])
const scrubUrl = (url: string, sensitiveKeys: string[]): string => {
  const parsedUrl = new URL(url)

  for (const [key, value] of parsedUrl.searchParams) {
    if (sensitiveKeys.includes(key)) {
      parsedUrl.searchParams.set(key, 'X'.repeat(value.length))
    }
  }

  return parsedUrl.href
}

export class HttpError extends Error {
  constructor (
    message: string,
    public readonly originalResponse: Response,
  ) {
    super(message)
  }

  public static async fromResponse (response: Response): Promise<HttpError> {
    const status = response.status
    const statusText = await (response.json().catch(() => {
      return response.statusText
    }))

    return new HttpError(
      `${status} ${statusText} (${scrubUrl(response.url, SENSITIVE_KEYS)})`,
      response,
    )
  }
}
