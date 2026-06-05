import type {
  ResponseMiddleware,
} from '@packages/proxy'
import { handleInterceptResponse } from '../handle-intercept-response'

/**
 * Called when an intercepted request receives a response from the origin.
 */
export const InterceptResponse: ResponseMiddleware = async function () {
  return this.networkInterceptionCore.interceptResponse(this)
}
