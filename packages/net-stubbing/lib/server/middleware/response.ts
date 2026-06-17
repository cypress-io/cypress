import type {
  ResponseMiddleware,
} from '@packages/proxy'

/**
 * Called when an intercepted request receives a response from the origin.
 */
export const InterceptResponse: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.interceptResponse(this)
}
