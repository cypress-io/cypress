import type {
  ForHttpIntercept,
  HttpRequest,
  HttpResponse,
  InterceptMiddleware,
  OriginForwarder,
} from '../ports/http-interception'

/**
 * Connection-agnostic middleware composer for network interception.
 *
 * Transport adapters (proxy, CDP) call {@link HttpIntercept.handle} with a fulfillment
 * function. Config middleware and the cy.intercept intercepter register via {@link HttpIntercept.use}.
 */
export class HttpIntercept implements ForHttpIntercept {
  private readonly middlewares: InterceptMiddleware[] = []

  use (middleware: InterceptMiddleware): void {
    this.middlewares.push(middleware)
  }

  handle: InterceptMiddleware = (
    request: HttpRequest,
    next: OriginForwarder,
  ): Promise<HttpResponse> => {
    const chain = this.middlewares.reduceRight<OriginForwarder>(
      (inner, layer) => (req) => layer(req, inner),
      next,
    )

    return chain(request)
  }
}
