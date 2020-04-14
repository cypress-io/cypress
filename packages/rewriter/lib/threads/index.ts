import _ from 'lodash'
import Debug from 'debug'
import * as path from 'path'
import os from 'os'
import { MessageChannel, Worker } from 'worker_threads'
import { RewriteRequest, RewriteResponse } from './types'

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

const MAX_WORKER_THREADS = Math.max(8, os.cpus().length)

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

type RewriteOpts = Pick<RewriteRequest, 'source' | 'isHtml'>

const workers: WorkerInfo[] = []
const queued: QueuedRewrite[] = []

let _idCounter = 0

function createWorker () {
  const startedAt = Date.now()
  let onlineMs: number

  const worker = {
    id: _idCounter++,
    isBusy: false,
    thread: new Worker(WORKER_PATH)
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
        worker: _debugWorker(worker) })
    }),
  }

  workers.push(worker)

  return worker
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
    ...opts,
  }

  worker.thread.postMessage(req, [req.port])

  const code = await new Promise((resolve, reject) => {
    const onExit = (exitCode) => {
      reject(new Error(`worker exited with exit code ${exitCode}`))
    }

    worker.thread.once('exit', onExit)
    worker.thread.once('error', reject)
    port2.on('message', (res: RewriteResponse) => {
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

      return resolve(res.code)
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
