import os from 'os'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getError } from '@packages/errors'
import { clearCtx, setCtx } from '@packages/data-context'
import type { DataContext } from '@packages/data-context'
import { run } from '../../../lib/modes/run'
import { openProject } from '../../../lib/open_project'
import { GracefulExit } from '../../../lib/util/graceful-exit'
import { resetConfigProcessExitForTesting } from '../../../lib/util/config_process_exit'

// Building the real schemas in this worker loads a second `graphql` realm, which `graphql` rejects.
vi.mock('@packages/data-context/graphql/schema', () => ({ graphqlSchema: {} }))

vi.mock('../../../lib/util/electron-app', () => ({ isRunningAsElectronProcess: () => false }))

describe('modes/run onError', () => {
  let onError: (err: Error) => void
  let consoleLog: ReturnType<typeof vi.spyOn>
  let exitGracefully: ReturnType<typeof vi.spyOn>

  const printed = () => consoleLog.mock.calls.map((args) => String(args[0])).join('\n')

  beforeEach(async () => {
    // run.ts reads the context through a lazy require, so a module mock would not reach it
    setCtx({
      browser: { machineBrowsers: async () => [] },
      lifecycleManager: { mainProcessWillDisconnect: async () => {} },
      destroy: async () => {},
    } as unknown as DataContext)

    consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
    exitGracefully = vi.spyOn(GracefulExit, 'exitGracefully').mockResolvedValue(undefined)

    // Run mode hands this callback to the project; it stops there so nothing else of the run has to exist.
    vi.spyOn(openProject, 'create').mockImplementation(async (_projectRoot, _args, options) => {
      onError = options.onError as (err: Error) => void

      throw new Error('stop after capturing onError')
    })

    await expect(run({ projectRoot: os.tmpdir(), socketId: 'socket' }, Promise.resolve())).rejects.toThrow('stop after capturing onError')
  })

  afterEach(async () => {
    await clearCtx()
    resetConfigProcessExitForTesting()
    vi.restoreAllMocks()
  })

  it('sends an ordinary error to the early exit, which prints it', () => {
    onError(getError('BROWSER_PROCESS_CLOSED_UNEXPECTEDLY', 'chrome'))

    expect(printed()).toContain('closed unexpectedly')
    expect(exitGracefully).not.toHaveBeenCalled()
  })

  it('prints a config process exit once and exits with code 1', () => {
    onError(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL'))
    onError(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', null, 'SIGKILL'))

    expect(printed().match(/exited unexpectedly/g)).toHaveLength(1)
    expect(exitGracefully).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('stays silent for ordinary errors after a config process exit', () => {
    onError(getError('CONFIG_PROCESS_EXITED_UNEXPECTEDLY', 1, null))
    consoleLog.mockClear()

    onError(getError('BROWSER_PROCESS_CLOSED_UNEXPECTEDLY', 'chrome'))

    expect(consoleLog).not.toHaveBeenCalled()
  })
})
