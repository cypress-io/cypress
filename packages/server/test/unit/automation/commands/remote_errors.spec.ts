import { describe, it, expect, vi } from 'vitest'
import { RemoteErrorReports } from '../../../../lib/automation/commands/remote_errors'

describe('lib/automation/commands/remote_errors', () => {
  describe('RemoteErrorReports', () => {
    it('flushes after a round trip to the AUT and the reports in flight', async () => {
      const order: string[] = []
      let finishReport: () => void = () => {}
      const reports = new RemoteErrorReports(async () => {
        order.push('evaluated')

        // an error event delivered before the evaluate's reply
        reports.report(new Promise<void>((resolve) => {
          finishReport = () => {
            order.push('reported')
            resolve()
          }
        }))
      })

      const flushed = reports.flush().then(() => order.push('flushed'))

      await vi.waitFor(() => expect(order).toEqual(['evaluated']))
      finishReport()
      await flushed

      expect(order).toEqual(['evaluated', 'reported', 'flushed'])
    })

    it('flushes when the AUT can\'t be evaluated in', async () => {
      const reports = new RemoteErrorReports(() => Promise.reject(new Error('Could not find AUT frame')))

      await expect(reports.flush()).resolves.toBeUndefined()
    })

    it('stops waiting on an AUT that doesn\'t answer', async () => {
      vi.useFakeTimers()

      try {
        const reports = new RemoteErrorReports(() => new Promise(() => {}))
        const flushed = reports.flush()

        await vi.advanceTimersByTimeAsync(1000)

        await expect(flushed).resolves.toBeUndefined()
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
