import type { NextFunction, Request, Response } from 'express'

/**
 * Wraps an async listener for a caller that drops the promise it returns, such
 * as an EventEmitter, socket.io or Electron, and sends a rejection to
 * `onRejection`. Unwrapped, the rejection reaches the process's
 * `unhandledRejection` handler, which in the main process exits Cypress.
 *
 * The wrapper is a new function, so pass the same wrapped reference to `on`
 * and `off`.
 */
export function handleRejection<Args extends unknown[]> (
  listener: (...args: Args) => PromiseLike<unknown>,
  onRejection: (err: unknown) => void,
): (...args: Args) => void {
  return (...args) => {
    Promise.resolve(listener(...args)).catch(onRejection)
  }
}

/**
 * Wraps an async Express route handler so a rejection is passed to `next`,
 * which hands it to the router's error middleware. Express 4 ignores the
 * promise a handler returns, so without this the request gets no response
 * and the rejection exits Cypress.
 */
export function forwardRejectionToNext<Req extends Request = Request> (
  handler: (req: Req, res: Response, next: NextFunction) => Promise<unknown>,
): (req: Req, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
