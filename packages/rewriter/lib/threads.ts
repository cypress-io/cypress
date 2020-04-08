import _ from 'lodash'
import Debug from 'debug'
import * as path from 'path'
import { MessageChannel, Worker } from 'worker_threads'
import { RewriteRequest, RewriteResponse } from './types'

const debug = Debug('cypress:rewriter:threads')

const WORKER_PATH = process.env.CYPRESS_INTERNAL_ENV === 'production' ?
  path.join(__dirname, 'worker.js')
  : path.join(__dirname, 'worker-shim.js')

const MAX_WORKER_THREADS = 4

type DeferredPromise<T> = { p: Promise<T>, resolve: () => {}, reject: () => {} }

type WorkerInfo = {
  thread: Worker
  isBusy: boolean
}

type QueuedRewrite = {
  deferred: DeferredPromise<string>
  opts: RewriteOpts
}

const workers: WorkerInfo[] = []
const queued: QueuedRewrite[] = []

function createWorker () {
  const worker = {
    isBusy: false,
    thread: new Worker(WORKER_PATH)
    .on('exit', () => {
      _.remove(workers, worker)
    }),
  }

  workers.push(worker)

  return worker
}

async function sendRewrite (worker: WorkerInfo, opts: RewriteOpts): Promise<string> {
  if (worker.isBusy) {
    throw new Error('worker is already busy')
  }

  worker.isBusy = true

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
    port2.on('message', ({ error, code }: RewriteResponse) => {
      worker.thread.removeListener('exit', onExit)
      worker.thread.removeListener('error', reject)

      if (error) {
        return reject(error)
      }

      return resolve(code)
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

  debug('running next rewrite in queue')

  queueRewriting(next.opts)
  .then(next.deferred.resolve)
  .catch(next.deferred.reject)
}

type RewriteOpts = Pick<RewriteRequest, 'source' | 'isHtml'>

export function queueRewriting (opts: RewriteOpts): Promise<string> {
  // if a worker is free now, use it
  const freeWorker = _.find(workers, { isBusy: false })

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
  debug('enqueuing source for rewriting')
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
