import type {
  ForHttpIntercept,
  ForOriginForwarding,
  HttpTransportCodec,
  InterceptMiddleware,
  TransportNext,
} from '../ports/http-interception'

export class HttpIntercept<TRequest, TResponse> implements ForHttpIntercept<TRequest, TResponse> {
  private readonly middlewares: InterceptMiddleware[] = []

  constructor (private readonly codec: HttpTransportCodec<TRequest, TResponse>) {}

  use (middleware: InterceptMiddleware): void {
    this.middlewares.push(middleware)
  }

  async handle (
    transportRequest: TRequest,
    next: TransportNext<TRequest, TResponse>,
  ): Promise<TResponse> {
    const request = this.codec.decodeRequest(transportRequest)

    const terminal: ForOriginForwarding = async (nextRequest) => {
      await this.codec.applyRequest(transportRequest, nextRequest)

      return this.codec.decodeResponse(await next(transportRequest))
    }

    const forward = this.middlewares.reduceRight<ForOriginForwarding>(
      (inner, middleware) => {
        return (nextRequest) => middleware(nextRequest, inner)
      },
      terminal,
    )

    return this.codec.encodeResponse(await forward(request))
  }
}
