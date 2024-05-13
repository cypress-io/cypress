import {
  CyHttpMessages,
  HttpRequestInterceptor,
  HttpResponseInterceptor,
  Interception,
  Route,
  RouteHandler,
  RouteHandlerController,
  RouteMap,
  RouteMatcher,
  StringMatcher
} from 'cypress/types/net-stubbing'

interface CustomRequest {
  payload: object
}

interface CustomResponse {
  data: object
}

describe('net stubbing types', () => {
  describe('BaseMessage', () => {
    it('has any body by default', () => {
      const sut: CyHttpMessages.BaseMessage = undefined!
      sut.body // $ExpectType any
    })

    it('has typed body if given', () => {
      const sut: CyHttpMessages.BaseMessage<CustomRequest> = undefined!
      sut.body // $ExpectType CustomRequest
    })
  })

  describe('IncomingResponse', () => {
    it('has any body by default', () => {
      const sut: CyHttpMessages.IncomingResponse = undefined!
      sut.body // $ExpectType any
    })

    it('has typed body if given', () => {
      const sut: CyHttpMessages.IncomingResponse<CustomResponse> = undefined!
      sut.body // $ExpectType CustomResponse
    })
  })

  describe('IncomingHttpResponse', () => {
    it('has any body by default', () => {
      const sut: CyHttpMessages.IncomingHttpResponse = undefined!
      sut.body // $ExpectType any
    })

    it('has typed body if given', () => {
      const sut: CyHttpMessages.IncomingHttpResponse<CustomResponse> = undefined!
      sut.body // $ExpectType CustomResponse
    })

    it('returns the typed body from setDelay', () => {
      const sut: CyHttpMessages.IncomingHttpResponse<CustomResponse> = undefined!
      sut.setDelay(0) // $ExpectType IncomingHttpResponse<CustomResponse>
    })

    it('returns the typed body from setThrottle', () => {
      const sut: CyHttpMessages.IncomingHttpResponse<CustomResponse> = undefined!
      sut.setThrottle(0) // $ExpectType IncomingHttpResponse<CustomResponse>
    })
  })

  describe('IncomingRequest', () => {
    it('has any body by default', () => {
      const sut: CyHttpMessages.IncomingRequest = undefined!
      sut.body // $ExpectType any
    })

    it('has typed body if given', () => {
      const sut: CyHttpMessages.IncomingRequest<CustomRequest> = undefined!
      sut.body // $ExpectType CustomRequest
    })
  })

  describe('IncomingHttpRequest', () => {
    it('has any body by default', () => {
      const sut: CyHttpMessages.IncomingHttpRequest = undefined!
      sut.body // $ExpectType any
    })

    it('has typed body if given', () => {
      const sut: CyHttpMessages.IncomingHttpRequest<CustomRequest> = undefined!
      sut.body // $ExpectType CustomRequest
    })

    it('accepts a typed interceptor, of the same expected response type, in continue()', () => {
      const sut: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!
      const input: HttpResponseInterceptor<CustomResponse> = undefined!

      sut.continue(input)
    })

    it('accepts a typed interceptor, of the same expected response type, in reply()', () => {
      const sut: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!
      const input: HttpResponseInterceptor<CustomResponse> = undefined!

      sut.reply(input)
    })
  })

  describe('ResponseComplete', () => {
    it('has any finalResBody by default', () => {
      const sut: CyHttpMessages.ResponseComplete = undefined!
      sut.finalResBody // $ExpectType any
    })

    it('has typed finalResBody if given', () => {
      const sut: CyHttpMessages.ResponseComplete<CustomResponse> = undefined!
      sut.finalResBody // $ExpectType CustomResponse | undefined
    })
  })

  describe('HttpRequestInterceptor', () => {
    it('accepts a request with any req/res body by default', () => {
      const sut: HttpRequestInterceptor = undefined!
      const request: CyHttpMessages.IncomingHttpRequest = undefined!

      sut(request)
    })

    it('accepts a request with a typed req/res body if given', () => {
      const sut: HttpRequestInterceptor<CustomRequest, CustomResponse> = undefined!
      const request: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!

      sut(request)
    })

    it('does not accept a request with a typed req/res body if mismatched', () => {
      const sut: HttpRequestInterceptor<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const request: CyHttpMessages.IncomingHttpRequest<CustomResponse, CustomRequest> = undefined!

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut(request)
    })
  })

  describe('HttpResponseInterceptor', () => {
    it('accepts a response with any body by default', () => {
      const sut: HttpResponseInterceptor = undefined!
      const response: CyHttpMessages.IncomingHttpResponse = undefined!

      sut(response)
    })

    it('accepts a response with a typed body if given', () => {
      const sut: HttpResponseInterceptor<CustomResponse> = undefined!
      const response: CyHttpMessages.IncomingHttpResponse<CustomResponse> = undefined!

      sut(response)
    })

    it('does not accept a response with a typed body if mismatched', () => {
      const sut: HttpResponseInterceptor<CustomResponse> = undefined!

      // Expecting a custom response, but response is just a string.
      const response: CyHttpMessages.IncomingHttpResponse<string> = undefined!

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut(response)
    })
  })

  describe('RequestEvents (via IncomingHttpRequest)', () => {
    it('accepts a response with any body by default, in each on()', () => {
      const sut: CyHttpMessages.IncomingHttpRequest = undefined!
      const cb: HttpResponseInterceptor = undefined!
      const cbAfter: (res: CyHttpMessages.IncomingResponse) => void = undefined!

      sut.on('before:response', cb) // $ExpectType IncomingHttpRequest<any, any>
      sut.on('response', cb) // $ExpectType IncomingHttpRequest<any, any>
      sut.on('after:response', cbAfter) // $ExpectType IncomingHttpRequest<any, any>
    })

    it('accepts a response with a typed body if given', () => {
      const sut: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!
      const cb: HttpResponseInterceptor<CustomResponse> = undefined!
      const cbAfter: (res: CyHttpMessages.IncomingResponse<CustomResponse>) => void = undefined!

      sut.on('before:response', cb) // $ExpectType IncomingHttpRequest<CustomRequest, CustomResponse>
      sut.on('response', cb) // $ExpectType IncomingHttpRequest<CustomRequest, CustomResponse>
      sut.on('after:response', cbAfter) // $ExpectType IncomingHttpRequest<CustomRequest, CustomResponse>
    })

    it('does not accept a response with a typed body if given but mismatched', () => {
      const sut: CyHttpMessages.IncomingHttpRequest<any, CustomResponse> = undefined!

      // Expecting a custom response, but callbacks just have mismatched string responses.
      const cb: HttpResponseInterceptor<string> = undefined!
      const cbAfter: (res: CyHttpMessages.IncomingResponse<string>) => void = undefined!

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut.on('before:response', cb)

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut.on('response', cb)

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut.on('after:response', cbAfter)
    })
  })

  describe('Interception', () => {
    it('has any req/res body by default', () => {
      const sut: Interception = undefined!

      sut.request.body // $ExpectType any
      sut.response!.body // $ExpectType any
    })

    it('has typed req/res body if given', () => {
      const sut: Interception<CustomRequest, CustomResponse> = undefined!

      sut.request.body // $ExpectType CustomRequest
      sut.response!.body // $ExpectType CustomResponse
    })
  })

  describe('Route', () => {
    it('has a handler typed as any by default', () => {
      const sut: Route = undefined!
      const request: CyHttpMessages.IncomingHttpRequest = undefined!

      sut.handler // $ExpectType RouteHandler<any, any>

      if (typeof sut.handler === 'function') {
        sut.handler(request)
      }
    })

    it('has a typed handler if given', () => {
      const sut: Route<CustomRequest, CustomResponse> = undefined!
      const request: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!

      sut.handler // $ExpectType RouteHandler<CustomRequest, CustomResponse>

      if (typeof sut.handler === 'function') {
        sut.handler(request)
      }
    })

    it('does not accept a typed handler if given but mismatched', () => {
      const sut: Route<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const request: CyHttpMessages.IncomingHttpRequest<CustomResponse, CustomRequest> = undefined!

      if (typeof sut.handler === 'function') {
        // @ts-expect-error -- Argument of type ... is not assignable.
        sut.handler(request)
      }
    })

    it('contains requests with interceptions of any req/res body by default', () => {
      const sut: Route = undefined!
      sut.requests['r'] // $ExpectType Interception<any, any>
    })

    it('contains requests with interceptions of typed req/res body if given', () => {
      const sut: Route<CustomRequest, CustomResponse> = undefined!
      sut.requests['r'] // $ExpectType Interception<CustomRequest, CustomResponse>
    })

    it('contains requests with interceptions, which do not accept mismatches, of typed req/res body if given', () => {
      const sut: Route<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const interception: Interception<CustomResponse, CustomRequest> = undefined!

      // @ts-expect-error -- Type ... is not assignable.
      sut.requests['r'] = interception
    })
  })

  describe('RouteMap', () => {
    it('each item has a handler typed as any by default', () => {
      const sut: RouteMap = undefined!
      const request: CyHttpMessages.IncomingHttpRequest = undefined!

      sut['r'] // $ExpectType Route<any, any>

      if (typeof sut['r'].handler === 'function') {
        sut['r'].handler(request)
      }
    })

    it('each item has a typed handler if given', () => {
      const sut: RouteMap<CustomRequest, CustomResponse> = undefined!
      const request: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!

      sut['r'] // $ExpectType Route<CustomRequest, CustomResponse>

      if (typeof sut['r'].handler === 'function') {
        sut['r'].handler(request)
      }
    })

    it('each item does not accept a typed handler if given but mismatched', () => {
      const sut: RouteMap<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const request: CyHttpMessages.IncomingHttpRequest<CustomResponse, CustomRequest> = undefined!

      if (typeof sut['r'].handler === 'function') {
        // @ts-expect-error -- Argument of type ... is not assignable.
        sut['r'].handler(request)
      }
    })

    it('each item contains requests with interceptions of any req/res body by default', () => {
      const sut: RouteMap = undefined!

      sut['r'] // $ExpectType Route<any, any>
      sut['r'].requests['r'] // $ExpectType Interception<any, any>
    })

    it('each item contains requests with interceptions of typed req/res body if given', () => {
      const sut: RouteMap<CustomRequest, CustomResponse> = undefined!

      sut['r'] // $ExpectType Route<CustomRequest, CustomResponse>
      sut['r'].requests['r'] // $ExpectType Interception<CustomRequest, CustomResponse>
    })

    it('each item contains requests with interceptions, which do not accept mismatches, of typed req/res body if given', () => {
      const sut: RouteMap<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const interception: Interception<CustomResponse, CustomRequest> = undefined!

      // @ts-expect-error -- Type ... is not assignable.
      sut['r'].requests['r'] = interception
    })
  })

  describe('RouteHandlerController', () => {
    it('accepts a request with any req/res body by default', () => {
      const sut: RouteHandlerController = undefined!
      const request: CyHttpMessages.IncomingHttpRequest = undefined!

      sut(request)
    })

    it('accepts a request with a typed req/res body if given', () => {
      const sut: RouteHandlerController<CustomRequest, CustomResponse> = undefined!
      const request: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!

      sut(request)
    })

    it('does not accept a request with a typed req/res body if mismatched', () => {
      const sut: RouteHandlerController<CustomRequest, CustomResponse> = undefined!

      // Request and response are flipped, which is incorrect.
      const request: CyHttpMessages.IncomingHttpRequest<CustomResponse, CustomRequest> = undefined!

      // @ts-expect-error -- Argument of type ... is not assignable.
      sut(request)
    })
  })

  describe('RouteHandler', () => {
    it('accepts a request with any req/res body by default', () => {
      const sut: RouteHandler = () => { }
      const request: CyHttpMessages.IncomingHttpRequest = undefined!

      if (typeof sut === 'function') {
        sut(request)
      }
    })

    it('accepts a request with a typed req/res body if given', () => {
      const sut: RouteHandler<CustomRequest, CustomResponse> = () => { }
      const request: CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse> = undefined!

      if (typeof sut === 'function') {
        sut(request)
      }
    })

    it('does not accept a request with a typed req/res body if mismatched', () => {
      const sut: RouteHandler<CustomRequest, CustomResponse> = () => { }

      // Request and response are flipped, which is incorrect.
      const request: CyHttpMessages.IncomingHttpRequest<CustomResponse, CustomRequest> = undefined!

      if (typeof sut === 'function') {
        // @ts-expect-error -- Argument of type ... is not assignable.
        sut(request)
      }
    })
  })

  describe('cy.intercept', () => {
    describe('for a route matcher URL', () => {
      it('accepts any req/res body as response handler by default', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        sut.intercept(url, (req) => {
          req.body // $ExpectType any

          req.continue((res) => {
            res.body // $ExpectType any
          })
        })
      })

      it('accepts typed req/res body as response handler if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        sut.intercept<CustomRequest, CustomResponse>(url, (req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })

      it('infers types for req/res body if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        type Req = CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse>

        sut.intercept(url, (req: Req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })
    })

    describe('for a method-restricted route matcher URL', () => {
      it('accepts any req/res body as response handler by default', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        sut.intercept('POST', url, (req) => {
          req.body // $ExpectType any

          req.continue((res) => {
            res.body // $ExpectType any
          })
        })
      })

      it('accepts typed req/res body as response handler if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        sut.intercept<CustomRequest, CustomResponse>('POST', url, (req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })

      it('infers types for req/res body if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: RouteMatcher = undefined!

        type Req = CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse>

        sut.intercept('POST', url, (req: Req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })
    })

    describe('for a string matcher URL', () => {
      it('accepts any req/res body as response handler by default', () => {
        const sut: Cypress.Chainable = undefined!
        const url: StringMatcher = undefined!

        sut.intercept(url, { middleware: true }, (req) => {
          req.body // $ExpectType any

          req.continue((res) => {
            res.body // $ExpectType any
          })
        })
      })

      it('accepts typed req/res body as response handler if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: StringMatcher = undefined!

        sut.intercept<CustomRequest, CustomResponse>(url, { middleware: true }, (req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })

      it('infers types for req/res body if given', () => {
        const sut: Cypress.Chainable = undefined!
        const url: StringMatcher = undefined!

        type Req = CyHttpMessages.IncomingHttpRequest<CustomRequest, CustomResponse>

        sut.intercept(url, { middleware: true }, (req: Req) => {
          req.body // $ExpectType CustomRequest

          req.continue((res) => {
            res.body // $ExpectType CustomResponse
          })
        })
      })
    })
  })

  describe('cy.wait', () => {
    describe('with a single alias', () => {
      it('accepts any req/res body as response handler by default', () => {
        const cy: Cypress.Chainable = undefined!

        cy.wait('@a').then(({ request, response }) => {
          request.body // $ExpectType any
          response!.body // $ExpectType any
        })
      })

      it('accepts typed req/res body as response handler if given', () => {
        const cy: Cypress.Chainable = undefined!

        cy.wait<CustomRequest, CustomResponse>('@a').then(({ request, response }) => {
          request.body // $ExpectType CustomRequest
          response!.body // $ExpectType CustomResponse
        })
      })

      it('infers types for req/res body if given', () => {
        const cy: Cypress.Chainable = undefined!

        cy.wait('@a').then(({ request, response }: Interception<CustomRequest, CustomResponse>) => {
          request.body // $ExpectType CustomRequest
          response!.body // $ExpectType CustomResponse
        })
      })
    })

    describe('with an array of aliases', () => {
      interface AReq { a: CustomRequest }
      interface BReq { b: CustomRequest }
      interface ARes { a: CustomResponse }
      interface BRes { b: CustomResponse }

      it('accepts any req/res body as response handler by default', () => {
        const cy: Cypress.Chainable = undefined!

        cy.wait([]).then((interceptions) => {
          interceptions // $ExpectType Interception<any, any>[]
        })

        cy.wait(['@a']).then((interceptions) => {
          interceptions.forEach(({ request, response }) => {
            request.body // $ExpectType any
            response!.body // $ExpectType any
          })
        })

        cy.wait(['@a', '@b']).then((interceptions) => {
          interceptions.forEach(({ request, response }) => {
            request.body // $ExpectType any
            response!.body // $ExpectType any
          })
        })
      })

      it('infers types for req/res body if given', () => {
        const cy: Cypress.Chainable = undefined!

        cy.wait(['@a']).then((interceptions: Array<Interception<AReq, ARes>>) => {
          interceptions.forEach(({ request, response }) => {
            request.body // $ExpectType AReq
            response!.body // $ExpectType ARes
          })
        })

        cy.wait(['@a', '@b']).then((interceptions: Array<Interception<AReq | BReq, ARes | BRes>>) => {
          interceptions.forEach(({ request, response }) => {
            request.body // $ExpectType AReq | BReq
            response!.body // $ExpectType ARes | BRes
          })
        })
      })
    })
  })
})
