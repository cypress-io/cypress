import debug from 'debug'
import { strict as assert } from 'assert'
import os from 'os'
import WorkerNodes from 'worker-nodes'
import type { ProcessScriptOpts, ProcessScriptResult } from '../types'

const workerScript = require.resolve('../../dist/doctor/process-script.worker')

const logInfo = debug('snapgen:info')
const logTrace = debug('snapgen:trace')

type AsyncScriptProcessorOpts = {
  maxWorkers?: number
}

const DEFAULT_ASYNC_SCRIPT_PROCESSOR_OPTS = {
  // By default we max out the machine in order to speed this up
  // NOTE: that it becomes pretty much unusable for anything else during that
  // time
  maxWorkers: os.cpus().length,
}

/**
 * Spreads the assembling and processing snapshot scripts based on a generated
 * bundle across multiple workers.
 * This results in a very considerable speedup.
 */
export class AsyncScriptProcessor {
  private readonly _workers: WorkerNodesInstance
  private _isDisposed: boolean

  /**
   * Creates a new {@link AsyncScriptProcessor} instance.
   *
   * @param args configure how much workers the processor can use
   */
  constructor (args: AsyncScriptProcessorOpts) {
    logInfo('Initializing async script processor')
    const processorOpts = Object.assign(
      {},
      DEFAULT_ASYNC_SCRIPT_PROCESSOR_OPTS,
      args,
    )
    const { maxWorkers } = processorOpts
    const minWorkers = maxWorkers / 2

    const opts = {
      autoStart: true,
      lazyStart: false,
      minWorkers,
      maxWorkers,
      maxTasksPerWorker: 1,
      taskMaxRetries: 0,
    }

    this._isDisposed = false

    this._workers = new WorkerNodes(workerScript, opts)
  }

  /**
   * Processes the provided snapshot script and verifies its soundness.
   *
   * @param opts passed to the worker in order to configure how the script is
   * assembled and which entryPoint to use
   */
  async processScript (opts: ProcessScriptOpts): Promise<ProcessScriptResult> {
    assert(!this._isDisposed, 'should not processScript when disposed')

    return this._workers.call.processScript(opts)
  }

  /**
   * Termiates all workers and refuses to take on any work after that
   */
  dispose () {
    logTrace('Disposing AsyncScriptProcessor')
    this._isDisposed = true

    return this._workers.terminate()
  }
}
