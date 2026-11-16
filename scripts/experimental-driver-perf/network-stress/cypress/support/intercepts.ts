import { LOAD_TIMEOUT, apiRoute, runLoad, visitLoad } from './load'
import type { Load } from './load'

// The ways a test commonly touches the requests it makes, from not at all to handling
// every request and response in the test. Each puts a different amount of traffic between
// the proxy and the driver.
export type Style =
  // No intercept: the requests only pass through the proxy
  | 'none'
  // A route with an alias and no handler, read back with `@alias.all`
  | 'spy'
  // The same route, with a cy.wait for every request that reads its body
  | 'wait-each'
  // A static response, so no request reaches the server
  | 'static-stub'
  // A handler that replies to each request
  | 'reply-handler'
  // A handler that lets each request through and changes its response
  | 'response-handler'
  // A handler that reads each request's body, for uploads
  | 'request-handler'

const recordFor = (id: number) => {
  return {
    id,
    name: `Stub ${id}`,
    email: `stub${id}@example.com`,
    createdAt: '2026-01-01T00:00:00.000Z',
    tags: ['alpha'],
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.',
  }
}

// A stubbed body of the same shape and roughly the same size as the server's
const stubBody = (load: Load) => {
  if (load.upload) {
    return { received: load.bytes }
  }

  if (load.kind === 'text') {
    return 'x'.repeat(load.bytes)
  }

  const recordBytes = JSON.stringify(recordFor(0)).length + 1

  return Array.from({ length: Math.ceil(load.bytes / recordBytes) }, (_, id) => recordFor(id))
}

const method = (load: Load) => load.upload ? 'POST' : 'GET'

const intercept = (load: Load, style: Style) => {
  const route = apiRoute(load)

  switch (style) {
    case 'none':
      return
    case 'spy':
    case 'wait-each':
      cy.intercept(method(load), route).as('load')

      return
    case 'static-stub':
      cy.intercept(method(load), route, { body: stubBody(load) }).as('load')

      return
    case 'reply-handler': {
      const body = stubBody(load)

      cy.intercept(method(load), route, (req) => {
        req.reply({ body })
      }).as('load')

      return
    }
    case 'response-handler':
      cy.intercept(method(load), route, (req) => {
        req.continue((res) => {
          res.headers['x-network-stress'] = 'seen'
        })
      }).as('load')

      return
    case 'request-handler':
      cy.intercept(method(load), route, (req) => {
        if (req.body.length !== load.bytes) {
          throw new Error(`expected a ${load.bytes} byte upload, got ${req.body.length}`)
        }
      }).as('load')

      return
    default:
      throw new Error(`unknown intercept style: ${style satisfies never}`)
  }
}

const verify = (load: Load, style: Style) => {
  if (style === 'none') {
    return
  }

  if (style !== 'wait-each') {
    // Under some drivers the log of intercepted requests lags behind the page, so
    // wait as long as the load itself rather than failing on the default timeout
    cy.get('@load.all', { timeout: LOAD_TIMEOUT }).should('have.length', load.count)

    return
  }

  Cypress._.times(load.count, () => {
    cy.wait('@load').then(({ request, response }) => {
      const body = load.upload ? request.body : response?.body

      expect(body, 'body').to.have.length.greaterThan(0)
    })
  })
}

export const stressNetwork = (load: Load, style: Style) => {
  visitLoad(load)
  intercept(load, style)
  runLoad(load)
  verify(load, style)
}
