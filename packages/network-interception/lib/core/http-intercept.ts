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
  }

  async handle (
    transportRequest: TRequest,
    next: TransportNext<TRequest, TResponse>,
  ): Promise<TResponse> {
    const request = this.codec.decodeRequest(transportRequest)

    type Forward = (nextRequest: HttpRequest) => Promise<HttpResponse>

    const terminal: Forward = async (nextRequest) => {
      const encodedRequest = this.codec.encodeRequest(nextRequest)

      return this.codec.decodeResponse(await next(encodedRequest))
    }

    const forward = this.middlewares.reduceRight<Forward>(
      (inner, middleware) => {
        return (nextRequest) => middleware(nextRequest, inner)
      },
      terminal,
    )

    return this.codec.encodeResponse(await forward(request))
  }
}
