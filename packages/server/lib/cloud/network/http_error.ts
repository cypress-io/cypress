import { scrubUrl } from '../api/scrub_url'

export const HttpErrorKind = 'HttpError'

export class HttpError extends Error {
  public readonly kind = HttpErrorKind
  constructor (
    message: string,
    public readonly url: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly responseBody: string,
    public readonly originalResponse: Response,
  ) {
    super(message)
  }

  public static isHttpError (error: Error & { kind?: any, originalResponse?: Response }): error is HttpError {
    return error?.kind === HttpErrorKind && Boolean(error.originalResponse)
  }

  public static async fromResponse (response: Response): Promise<HttpError> {
    const status = response.status
    const statusText = response.statusText
    const responseBody = await response.text()
    const scrubbedUrl = scrubUrl(response.url)

    return new HttpError(
      `${scrubUrl(response.url)} responded with ${status} ${statusText}`,
      scrubbedUrl,
      status,
      statusText,
      responseBody,
      response,
    )
  }
}
