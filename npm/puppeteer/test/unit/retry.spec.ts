import { describe, it, expect, vi } from 'vitest'
import { retry } from '../../src/plugin'

describe('#retry', () => {
  it('returns result of passing 1st attempt', async () => {
    const fn = vi.fn().mockReturnValue('passes 1st attempt')
    const result = await retry(fn)

    expect(fn).toHaveBeenCalledOnce()
    expect(result).toEqual('passes 1st attempt')
  })

  it('retries after delay and returns result of subsequent passing attempt', async () => {
    const fn = vi.fn()

    fn.mockImplementationOnce(() => { throw new Error('fail') })
    fn.mockImplementationOnce(() => { return 'passes 2nd attempt' })

    const result = await retry(fn, { delayBetweenTries: 1 })

    expect(fn).toHaveBeenCalledTimes(2)
    expect(result).toEqual('passes 2nd attempt')
  })

  it('retries up to timeout and returns result of subsequent passing attempt', async () => {
    const fn = vi.fn()

    fn.mockImplementationOnce(() => { throw new Error('fail') })
    fn.mockImplementationOnce(() => { throw new Error('fail') })
    fn.mockImplementationOnce(() => { throw new Error('fail') })
    fn.mockImplementationOnce(() => { throw new Error('fail') })
    fn.mockImplementationOnce(() => { return 'passes 5th attempt' })

    const result = await retry(fn, { delayBetweenTries: 1 })

    expect(fn).toHaveBeenCalledTimes(5)
    expect(result).toEqual('passes 5th attempt')
  })

  it('fails if function does not pass before timeout', async () => {
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('fail')
    })

    await expect(
      retry(fn, { timeout: 5, delayBetweenTries: 1 }),
    ).rejects.toThrow('Failed retrying after 5ms: fail')
  })
})
