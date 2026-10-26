import { describe, expect, it, vi } from 'vitest'
import { ProjectBase } from '../../lib/project-base'
import { ReporterOutputError } from '../../lib/reporter'
import { ensureProp } from '../../lib/util/class-helpers'

vi.mock('@packages/data-context/graphql/schema', () => ({ graphqlSchema: {} }))
vi.mock('@packages/data-context/graphql', () => ({ remoteSchemaWrapped: {} }))
vi.mock('../../lib/automation', () => ({ Automation: class {} }))

describe('reporter output failure at the socket lifecycle boundary', () => {
  const setup = (end: () => Promise<unknown>) => {
    const project: any = Object.create(ProjectBase.prototype)
    const reporter = { emit: vi.fn(), end }

    project.ensureProp = ensureProp
    project.initializeReporter = () => reporter
    project._server = {
      startWebsockets: vi.fn(),
      setProtocolManager: vi.fn(),
      getBrowserPreRequests: vi.fn(),
      end: vi.fn().mockResolvedValue(undefined),
    }

    project.ctx = { actions: { servers: { setAppSocketServer: vi.fn() } } }
    project.options = { onError: vi.fn() }
    project.emit = vi.fn()
    project.startWebsockets({}, {})
    const callbacks = project._server.startWebsockets.mock.calls[0][2]

    return { project, onMocha: callbacks.onMocha }
  }

  it('routes a failed JSON write to the existing run terminator without an unobserved rejection', async () => {
    const error = new ReporterOutputError('/synthetic/results.json', new Error('EACCES: synthetic denial'))
    const { project, onMocha } = setup(() => Promise.reject(error))

    await expect(onMocha('end')).resolves.toBeUndefined()
    expect(project.options.onError).toHaveBeenCalledWith(error)
    expect(project.emit).not.toHaveBeenCalledWith('end', expect.anything())
    expect(project._server.end).toHaveBeenCalledOnce()
  })

  it('keeps unrelated end failures observable instead of treating them as output failures', async () => {
    const error = new Error('unrelated reporter failure')
    const { project, onMocha } = setup(() => Promise.reject(error))

    await expect(onMocha('end')).rejects.toBe(error)
    expect(project.options.onError).not.toHaveBeenCalled()
  })

  it('still emits successful completion with the reporter results', async () => {
    const stats = { stats: { failures: 0 } }
    const { project, onMocha } = setup(() => Promise.resolve(stats))

    await onMocha('end')
    expect(project.emit).toHaveBeenCalledWith('end', stats)
    expect(project.options.onError).not.toHaveBeenCalled()
  })
})
