import { debug } from '../debug'
import type {
  ForHttpIntercept,
  HttpRequest,
  HttpResponse,
  InterceptMiddleware,
  TransportCodecPort,
  TransportNext,
} from '../ports/http-interception'

export class HttpIntercept<TRequest, TResponse> implements ForHttpIntercept<TRequest, TResponse> {
  private readonly middlewares: InterceptMiddleware[] = []

  constructor (private readonly codec: TransportCodecPort<TRequest, TResponse>) {}

  use (middleware: InterceptMiddleware): void {
    this.middlewares.push(middleware)
    debug.http('registered middleware (%d total)', this.middlewares.length)
  }

  async handle (
    transportRequest: TRequest,
    next: TransportNext<TRequest, TResponse>,
  ): Promise<TResponse> {
    const request = this.codec.decodeRequest(transportRequest)

    debug.http('handle %s %s (%d middleware)', request.method ?? 'GET', request.url, this.middlewares.length)

    type Forward = (nextRequest: HttpRequest) => Promise<HttpResponse>

    const terminal: Forward = async (nextRequest) => {
      debug.http('forwarding to origin %s %s', nextRequest.method ?? 'GET', nextRequest.url)
      const encodedRequest = this.codec.encodeRequest(nextRequest)

      return this.codec.decodeResponse(await next(encodedRequest))
    }

    const forward = this.middlewares.reduceRight<Forward>(
      (inner, middleware) => {
        return (nextRequest) => middleware(nextRequest, inner)
      },
      terminal,
    )

    try {
      const httpResponse = await forward(request)
      const response = this.codec.encodeResponse(httpResponse)

      debug.http('handle complete %s %s -> %d', request.method ?? 'GET', request.url, httpResponse.statusCode ?? 0)

      return response
    } finally {
      this.codec.releaseRequest?.(request.id)
      debug.http('released request %s', request.id)
    }
  }
}
