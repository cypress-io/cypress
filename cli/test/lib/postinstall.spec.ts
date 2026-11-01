import { vi, beforeEach, describe, it, expect } from 'vitest'

const tasks = vi.hoisted(() => {
  return {
    installStart: vi.fn(),
    verifyStart: vi.fn(),
    logErrorExit1: vi.fn(),
  }
})

vi.mock('../../lib/util', () => ({ default: { logErrorExit1: tasks.logErrorExit1 } }))
vi.mock('../../lib/tasks/install', () => ({ default: { start: tasks.installStart } }))
vi.mock('../../lib/tasks/verify', () => ({ start: tasks.verifyStart }))

import { runExecTask } from '../../lib/postinstall'

describe('postinstall', function () {
  beforeEach(function () {
    vi.clearAllMocks()
    tasks.installStart.mockResolvedValue(undefined)
    tasks.verifyStart.mockResolvedValue(undefined)
  })

  it('runs the install task for --exec install', async () => {
    await runExecTask(['--exec', 'install', '--force'])

    expect(tasks.installStart).toHaveBeenCalledWith({ force: true })
    expect(tasks.verifyStart).not.toHaveBeenCalled()
  })

  it('runs a forced verify for --exec verify', async () => {
    await runExecTask(['--exec', 'verify'])

    expect(tasks.verifyStart).toHaveBeenCalledWith({ force: true })
    expect(tasks.installStart).not.toHaveBeenCalled()
  })

  it('reports a failed task through util.logErrorExit1', async () => {
    const err = new Error('download failed')

    tasks.installStart.mockRejectedValue(err)

    await runExecTask(['--exec', 'install'])

    expect(tasks.logErrorExit1).toHaveBeenCalledWith(err)
  })

  it('does nothing without --exec', async () => {
    await runExecTask([])

    expect(tasks.installStart).not.toHaveBeenCalled()
    expect(tasks.verifyStart).not.toHaveBeenCalled()
  })
})
