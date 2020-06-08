import _ from 'lodash'
import Bluebird from 'bluebird'
import Debug from 'debug'
import * as path from 'path'
import os from 'os'
import { MessageChannel, Worker } from 'worker_threads'
import { RewriteRequest, RewriteResponse } from './types'
import { DeferSourceMapRewriteFn } from '../js'

const debug = Debug('cypress:rewriter:threads')

const _debugWorker = !debug.enabled ? _.noop : (worker: WorkerInfo) => {
  return { ..._.pick(worker, 'isBusy', 'id'), freeWorkers: _.filter(workers, { isBusy: false }).length }
}

const _debugOpts = !debug.enabled ? _.noop : (opts: RewriteOpts) => {
  return { ..._.pick(opts, 'isHtml'), sourceLength: opts.source.length }
}

// in production, it is preferable to use the transpiled version of `worker.ts`
// because it does not require importing @packages/ts like development does.
// this has a huge performance impact, bringing the `responsiveMs` for threads
// from ~1s to about ~300ms on my system
const WORKER_FILENAME = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'worker.js' : 'worker-shim.js'

const WORKER_PATH = path.join(__dirname, WORKER_FILENAME)

// spawn up to `os.cpus().length` threads (default to 4 if this call fails)
const MAX_WORKER_THREADS = _.get(os.cpus(), 'length') || 4

// spawn up to 4 threads at startup
const INITIAL_WORKER_THREADS = Math.min(MAX_WORKER_THREADS, 4)

type DeferredPromise<T> = { p: Promise<T>, resolve: () => {}, reject: () => {} }

type WorkerInfo = {
  id: number
  thread: Worker
  isBusy: boolean
}

type QueuedRewrite = {
  deferred: DeferredPromise<string>
  opts: RewriteOpts
}

type RewriteOpts = Pick<RewriteRequest, 'url' | 'source' | 'isHtml' | 'sourceMap' | 'inputSourceMap'> & {
  deferSourceMapRewrite?: DeferSourceMapRewriteFn
}

const workers: WorkerInfo[] = []
const queued: QueuedRewrite[] = []

let originalProcessExit

// HACK: electron can SIGABRT if exiting while worker_threads are active, so overwrite process.exit
// to ensure that all worker threads are killed *before* exiting.
// @see https://github.com/electron/electron/issues/23366
function wrapProcessExit () {
  if (originalProcessExit) {
    return
  }

  originalProcessExit = process.exit

  // note - process.exit is normally synchronous, so this could potentially cause strange behavior
  // @ts-ignore
  process.exit = _.once(async (...args) => {
    debug('intercepted process.exit called, closing worker threads')
    terminateAllWorkers()
    .delay(100)
    .finally(() => {
      debug('all workers terminated, exiting for real')
      originalProcessExit.call(process, ...args)
    })
  })
}

function createWorker () {
  const startedAt = Date.now()
  let onlineMs: number

  const thread = new Worker(WORKER_PATH)
  .on('exit', (exitCode) => {
    debug('worker exited %o', { exitCode, worker: _debugWorker(worker) })
    _.remove(workers, worker)
  })
  .on('online', () => {
    onlineMs = Date.now() - startedAt
  })
  .on('message', () => {
    debug('received initial ready message from worker %o', {
      onlineMs, // time for JS to start executing
      responsiveMs: Date.now() - startedAt, // time for worker to be ready for commands
      worker: _debugWorker(worker),
    })
  })

  const worker = {
    id: thread.threadId,
    isBusy: false,
    thread,
  }

  workers.push(worker)

  wrapProcessExit()

  return worker
}

export function createInitialWorkers () {
  // since workers take a little bit of time to start up (due to loading Node and `require`s),
  // performance can be gained by letting them start before user tests run
  if (workers.length > 0) {
    return
  }

  _.times(INITIAL_WORKER_THREADS, createWorker)
}

// try to cleanly shut down worker threads to avoid SIGABRT in Electron
// @see https://github.com/electron/electron/issues/23366
export function shutdownWorker (workerInfo: WorkerInfo) {
  const { thread } = workerInfo

  return new Bluebird((resolve) => {
    thread.once('exit', resolve)
    thread.once('error', resolve)
    thread.postMessage({ shutdown: true })
  })
  .timeout(100)
  .catch((err) => {
    debug('error cleanly shutting down worker, terminating from parent %o', { err, workerInfo: _debugWorker(workerInfo) })

    return thread.terminate()
  })
}

export function terminateAllWorkers () {
  return Bluebird.map(workers, shutdownWorker)
}

async function sendRewrite (worker: WorkerInfo, opts: RewriteOpts): Promise<string> {
  const startedAt = Date.now()

  debug('sending rewrite to worker %o', { worker: _debugWorker(worker), opts: _debugOpts(opts) })

  if (worker.isBusy) {
    throw new Error('worker is already busy')
  }

  worker.isBusy = true

  if (!getFreeWorker() && workers.length < MAX_WORKER_THREADS) {
    // create a worker in anticipation of another rewrite coming in
    createWorker()
  }

  const { port1, port2 } = new MessageChannel()

  const req: RewriteRequest = {
    port: port1,
    ..._.omit(opts, 'deferSourceMapRewrite'),
  }

  worker.thread.postMessage(req, [req.port])

  const code = await new Promise((resolve, reject) => {
    const onExit = (exitCode) => {
      reject(new Error(`worker exited with exit code ${exitCode}`))
    }

    worker.thread.once('exit', onExit)
    worker.thread.once('error', reject)
    port2.on('message', (res: RewriteResponse) => {
      if (res.deferredSourceMap) {
        return opts.deferSourceMapRewrite!(res.deferredSourceMap)
      }

      const totalMs = Date.now() - startedAt

      debug('received response from worker %o', {
        error: res.error,
        totalMs: Date.now() - startedAt,
        threadMs: res.threadMs, // time taken to run rewriting in thread
        overheadMs: totalMs - res.threadMs, // time not accounted for by `threadMs`
        worker: _debugWorker(worker),
        opts: _debugOpts(opts),
      })

      worker.thread.removeListener('exit', onExit)
      worker.thread.removeListener('error', reject)

      if (res.error) {
        return reject(res.error)
      }

      return resolve(res.output)
    })
  })
  .finally(() => {
    port2.close()
    worker.isBusy = false
    maybeRunNextInQueue()
  }) as Promise<string>

  return code
}

function maybeRunNextInQueue () {
  const next = queued.shift()

  if (!next) {
    return
  }

  debug('running next rewrite in queue', { opts: _debugOpts() })

  queueRewriting(next.opts)
  .then(next.deferred.resolve)
  .catch(next.deferred.reject)
}

function getFreeWorker (): WorkerInfo | undefined {
  return _.find(workers, { isBusy: false })
}

export function queueRewriting (opts: RewriteOpts): Promise<string> {
  // if a worker is free now, use it
  const freeWorker = getFreeWorker()

  if (freeWorker) {
    debug('sending source to free worker')

    return sendRewrite(freeWorker, opts)
  }

  // if there's room, create a new thread
  if (workers.length < MAX_WORKER_THREADS) {
    debug('creating new worker')
    const newWorker = createWorker()

    return sendRewrite(newWorker, opts)
  }

  // otherwise enqueue
  debug('enqueuing source for rewriting %o', { opts: _debugOpts(opts), prevQueueLength: queued.length })
  const deferred = getDeferredPromise()

  queued.push({ opts, deferred })

  return deferred.p
}

function getDeferredPromise (): DeferredPromise<any> {
  let resolve; let reject

  const p = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { p, resolve, reject }
}
