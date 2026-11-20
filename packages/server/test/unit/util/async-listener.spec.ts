import { describe, expect, it, vi } from 'vitest'
import type { NextFunction, Request, Response } from 'express'
import { forwardRejectionToNext, handleRejection } from '../../../lib/util/async-listener'

const settle = () => new Promise((resolve) => setImmediate(resolve))

describe('lib/util/async-listener', () => {
  describe('handleRejection', () => {
    it('passes the arguments through and returns nothing', async () => {
      const listener = vi.fn().mockResolvedValue('ignored')
      const onRejection = vi.fn()

      const wrapped = handleRejection(listener, onRejection)

      expect(wrapped('Target.attachedToTarget', { sessionId: '8A3C9F1E2D4B6A7C' })).toBeUndefined()

      await settle()

      expect(listener).toHaveBeenCalledWith('Target.attachedToTarget', { sessionId: '8A3C9F1E2D4B6A7C' })
      expect(onRejection).not.toHaveBeenCalled()
    })

    it('sends a rejection to onRejection', async () => {
      const err = new Error('Target closed: Session with given id not found.')
      const onRejection = vi.fn()

      handleRejection(async () => {
        throw err
      }, onRejection)()

      await settle()

      expect(onRejection).toHaveBeenCalledWith(err)
    })

    it('handles a rejection from a Bluebird-style thenable', async () => {
      const err = new Error('ENOENT: no such file or directory')
      const onRejection = vi.fn()
      const thenable: PromiseLike<never> = {
        then: (_onFulfilled, onRejected) => Promise.reject(err).then(undefined, onRejected),
      }

      handleRejection(() => thenable, onRejection)()

      await settle()

      expect(onRejection).toHaveBeenCalledWith(err)
    })
  })

  describe('forwardRejectionToNext', () => {
    const req = { url: '/__cypress/iframes/cypress/e2e/login.cy.ts' } as Request
    const res = {} as Response

    it('does not call next when the handler resolves', async () => {
      const next: NextFunction = vi.fn()
      const handler = vi.fn().mockResolvedValue(undefined)

      forwardRejectionToNext(handler)(req, res, next)

      await settle()

      expect(handler).toHaveBeenCalledWith(req, res, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('passes a rejection to next', async () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:8080')
      const next: NextFunction = vi.fn()

      forwardRejectionToNext(async () => {
        throw err
      })(req, res, next)

      await settle()

      expect(next).toHaveBeenCalledWith(err)
    })
  })
})
