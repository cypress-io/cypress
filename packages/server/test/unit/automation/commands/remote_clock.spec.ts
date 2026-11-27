import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RemoteClock } from '../../../../lib/automation/commands/remote_clock'

const CLOCK_SOURCE = '/* clock bundle */'

describe('RemoteClock', () => {
  let remove: ReturnType<typeof vi.fn>
  let scripts: { addPreloadScript: ReturnType<typeof vi.fn>, evaluateInAut: ReturnType<typeof vi.fn> }
  let clock: RemoteClock

  beforeEach(() => {
    remove = vi.fn().mockResolvedValue(undefined)
    scripts = {
      addPreloadScript: vi.fn().mockResolvedValue(remove),
      evaluateInAut: vi.fn().mockResolvedValue('{"now":1000,"methods":["setTimeout"]}'),
    }

    clock = new RemoteClock(scripts, async () => CLOCK_SOURCE)
  })

  it('installs the clock in new AUT documents and in the current one', async () => {
    await expect(clock.install({ now: 1000, methods: ['setTimeout'] })).resolves.toEqual({ now: 1000, methods: ['setTimeout'] })

    const [preload] = scripts.addPreloadScript.mock.calls[0]

    expect(preload).toContain('window.name.startsWith("Your project:")')
    expect(preload).toContain(CLOCK_SOURCE)
    expect(preload).toContain('install(1000, ["setTimeout"])')
    expect(scripts.evaluateInAut).toHaveBeenCalledOnce()
  })

  it('sends the clock\'s source only to a document that doesn\'t have it', async () => {
    scripts.evaluateInAut.mockResolvedValueOnce('__cypress_remote_clock_missing__')

    await clock.tick({ ms: 50 })

    expect(scripts.evaluateInAut).toHaveBeenCalledTimes(2)
    expect(scripts.evaluateInAut.mock.calls[0][0]).not.toContain(CLOCK_SOURCE)
    expect(scripts.evaluateInAut.mock.calls[1][0]).toContain(CLOCK_SOURCE)
    expect(scripts.evaluateInAut.mock.calls[1][0]).toContain('tick(50)')
  })

  it('applies calls in the order they arrive', async () => {
    const order: string[] = []

    scripts.evaluateInAut.mockImplementation(async (expression: string) => {
      order.push(expression.includes('install') ? 'install' : 'tick')

      return '{"now":0,"methods":[]}'
    })

    await Promise.all([clock.install({}), clock.tick({ ms: 1 })])

    expect(order).toEqual(['install', 'tick'])
  })

  it('removes the preload script and restores the current document', async () => {
    await clock.install({})
    await clock.restore()

    expect(remove).toHaveBeenCalledOnce()
    expect(scripts.evaluateInAut.mock.calls[1][0]).toContain('clock.restore()')
    expect(scripts.evaluateInAut.mock.calls[1][0]).not.toContain(CLOCK_SOURCE)
  })
})
