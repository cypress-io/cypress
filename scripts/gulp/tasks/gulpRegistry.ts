import type { ChildProcess } from 'child_process'
import pDefer from 'p-defer'
import treeKill from 'tree-kill'
import gulp from 'gulp'

const childProcesses = new Set<ChildProcess>()
const exitedPids = new Set<number>()

let hasExited = false

export function addChildProcess (child: ChildProcess) {
  if (hasExited) {
    treeKill(child.pid)

    return
  }

  childProcesses.add(child)
  child.on('exit', () => {
    if (!hasExited) {
      exitAndRemoveProcess(child)
    }
  })
}

export async function exitAndRemoveProcess (child: ChildProcess) {
  if (exitedPids.has(child.pid)) {
    return
  }

  if (!childProcesses.has(child)) {
    throw new Error(`Cannot remove child process ${child.pid}, it was never registered`)
  }

  childProcesses.delete(child)

  const dfd = pDefer()

  exitedPids.add(child.pid)
  treeKill(child.pid, (err) => {
    if (err) {
      console.error(err)
    }

    dfd.resolve()
  })

  return dfd.promise
}

export async function exitAllProcesses () {
  await Promise.all(Array.from(childProcesses).map(exitAndRemoveProcess))
}

process.stdin.resume() //so the program will not close instantly

const _task = gulp.task

// So that we auto-exit on single tasks
// @ts-expect-error
gulp.task = function () {
  if (arguments.length === 1 && typeof arguments[0] === 'function') {
    process.stdin.pause()
  }

  // @ts-ignore
  return _task.apply(this, arguments)
}

export async function exitAfterAll () {
  process.stdin.pause()
}

async function exitHandler (exitCode: number) {
  hasExited = true
  console.log(`Exiting with code ${exitCode}`)
  await exitAllProcesses()
  process.exit(exitCode)
}

async function signalHandler (signal: NodeJS.Signals, code: number) {
  hasExited = true
  console.log(`Exiting due to ${signal}`)
  await exitAllProcesses()
  process.exit(128 + code)
}

async function uncaughtExceptionHandler (error: Error) {
  hasExited = true
  console.log(`Uncaught exception ${error.message}`)
  await exitAllProcesses()
  process.exit(6)
}

// do something when app is closing
process.on('exit', exitHandler)

// catches ctrl+c event
process.on('SIGINT', signalHandler)

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', signalHandler)
process.on('SIGUSR2', signalHandler)

// catches uncaught exceptions
process.on('uncaughtException', uncaughtExceptionHandler)
