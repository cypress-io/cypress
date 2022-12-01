'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.queueRewriting = exports.terminateAllWorkers = exports.shutdownWorker = exports.createInitialWorkers = void 0

const tslib_1 = require('tslib')
const lodash_1 = tslib_1.__importDefault(require('lodash'))
const bluebird_1 = tslib_1.__importDefault(require('bluebird'))
const debug_1 = tslib_1.__importDefault(require('debug'))
const path = tslib_1.__importStar(require('path'))
const os_1 = tslib_1.__importDefault(require('os'))
const worker_threads_1 = require('worker_threads')
const debug = (0, debug_1.default)('cypress:rewriter:threads')
const _debugWorker = !debug.enabled ? lodash_1.default.noop : (worker) => {
  return { ...lodash_1.default.pick(worker, 'isBusy', 'id'), freeWorkers: lodash_1.default.filter(workers, { isBusy: false }).length }
}
const _debugOpts = !debug.enabled ? lodash_1.default.noop : (opts) => {
  return { ...lodash_1.default.pick(opts, 'isHtml'), sourceLength: opts.source.length }
}
// in production, it is preferable to use the transpiled version of `worker.ts`
// because it does not require importing @packages/ts like development does.
// this has a huge performance impact, bringing the `responsiveMs` for threads
// from ~1s to about ~300ms on my system
const WORKER_FILENAME = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'worker.js' : '../../script/worker-shim.js'
const WORKER_PATH = path.join(__dirname, WORKER_FILENAME)
// spawn up to `os.cpus().length` threads (default to 4 if this call fails)
const MAX_WORKER_THREADS = lodash_1.default.get(os_1.default.cpus(), 'length') || 4
// spawn up to 4 threads at startup
const INITIAL_WORKER_THREADS = Math.min(MAX_WORKER_THREADS, 4)
const workers = []
const queued = []
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
  process.exit = lodash_1.default.once(async (...args) => {
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
  let onlineMs
  const thread = new worker_threads_1.Worker(WORKER_PATH)
  .on('exit', (exitCode) => {
    debug('worker exited %o', { exitCode, worker: _debugWorker(worker) })
    lodash_1.default.remove(workers, worker)
  })
  .on('online', () => {
    onlineMs = Date.now() - startedAt
  })
  .on('message', () => {
    debug('received initial ready message from worker %o', {
      onlineMs,
      responsiveMs: Date.now() - startedAt,
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
function createInitialWorkers () {
  // since workers take a little bit of time to start up (due to loading Node and `require`s),
  // performance can be gained by letting them start before user tests run
  if (workers.length > 0) {
    return
  }

  lodash_1.default.times(INITIAL_WORKER_THREADS, createWorker)
}
exports.createInitialWorkers = createInitialWorkers

// try to cleanly shut down worker threads to avoid SIGABRT in Electron
// @see https://github.com/electron/electron/issues/23366
function shutdownWorker (workerInfo) {
  const { thread } = workerInfo

  return new bluebird_1.default((resolve) => {
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
exports.shutdownWorker = shutdownWorker

function terminateAllWorkers () {
  return bluebird_1.default.map(workers, shutdownWorker)
}
exports.terminateAllWorkers = terminateAllWorkers

async function sendRewrite (worker, opts) {
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

  const { port1, port2 } = new worker_threads_1.MessageChannel()
  const req = {
    port: port1,
    ...lodash_1.default.omit(opts, 'deferSourceMapRewrite'),
  }

  worker.thread.postMessage(req, [req.port])
  const code = await new Promise((resolve, reject) => {
    const onExit = (exitCode) => {
      reject(new Error(`worker exited with exit code ${exitCode}`))
    }

    worker.thread.once('exit', onExit)
    worker.thread.once('error', reject)
    port2.on('message', (res) => {
      if (res.deferredSourceMap) {
        return opts.deferSourceMapRewrite(res.deferredSourceMap)
      }

      const totalMs = Date.now() - startedAt

      debug('received response from worker %o', {
        error: res.error,
        totalMs: Date.now() - startedAt,
        threadMs: res.threadMs,
        overheadMs: totalMs - res.threadMs,
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
  })

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
function getFreeWorker () {
  return lodash_1.default.find(workers, { isBusy: false })
}
function queueRewriting (opts) {
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
exports.queueRewriting = queueRewriting

function getDeferredPromise () {
  let resolve
  let reject
  const p = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return { p, resolve, reject }
}
