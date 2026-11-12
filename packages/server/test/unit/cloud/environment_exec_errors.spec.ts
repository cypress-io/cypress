import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import base64url from 'base64url'

type ExecCallback = (err: Error | null, result?: { stdout: string, stderr: string }) => void
type ExecMock = (cmd: string, optionsOrCallback?: { maxBuffer?: number } | ExecCallback, callback?: ExecCallback) => void

const exec = vi.hoisted(() => vi.fn<ExecMock>())

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>()

  return { ...actual, exec }
})

const { default: getEnvInformationForProjectRoot } = await import('../../../lib/cloud/environment')

const OTHER_ENV_VAR = 'OTHER_ENV_VAR=fake'
const PID = '4242'
const NODE_DEFAULT_EXEC_MAX_BUFFER = 1024 * 1024
const projectRoot = path.join(__dirname, '..', '..', 'support', 'fixtures', 'cloud', 'environment', 'partial-dependencies-matching')

// promisify(exec) passes the callback last, after options when there are any
const callbackOf = (optionsOrCallback: Parameters<ExecMock>[1], callback: ExecCallback | undefined) => {
  const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback

  if (!cb) {
    throw new Error('exec mock was called without a callback')
  }

  return cb
}

// Errors shaped the way Node's exec builds them: `stdout`, `stderr` and `cmd`
// are attached as enumerable properties, `message` and `stack` are not enumerable
const nonZeroExitError = (cmd: string) => {
  const stderr = ''

  return Object.assign(new Error(`Command failed: ${cmd}\n${stderr}`), {
    code: 1,
    killed: false,
    signal: null,
    cmd,
    stdout: `${PID} node index.js ${OTHER_ENV_VAR} PATH=/usr/bin\n`,
    stderr,
  })
}

const maxBufferError = (cmd: string) => {
  return Object.assign(new RangeError('stdout maxBuffer length exceeded'), {
    code: 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
    cmd,
    stdout: `${PID} node index.js ${OTHER_ENV_VAR} PATH=/usr/bin\n`,
    stderr: OTHER_ENV_VAR,
  })
}

// NOTE: the process-tree lookup only runs on non-Windows platforms
describe.skipIf(process.platform === 'win32')('lib/cloud/environment exec errors', () => {
  beforeEach(() => {
    vi.stubEnv('CYPRESS_API_URL', undefined)
    vi.stubEnv('CYPRESS_ENV_DEPENDENCIES', base64url.encode(JSON.stringify({
      maybeCheckProcessTreeIfPresent: ['foo'],
      neverCheckProcessTreeIfPresent: ['bar'],
    })))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    exec.mockReset()
  })

  it.each([
    ['a non-zero exit', nonZeroExitError],
    ['an exceeded maxBuffer', maxBufferError],
  ])('only sends name, message and stack when ps eww rejects with %s', async (_description, makeError) => {
    let thrown: Error | undefined

    exec.mockImplementation((cmd, optionsOrCallback, maybeCallback) => {
      const callback = callbackOf(optionsOrCallback, maybeCallback)

      if (cmd.startsWith('ps -eo')) {
        callback(null, { stdout: `${PID} 1\n1 0\n`, stderr: '' })

        return
      }

      thrown = makeError(cmd)
      callback(thrown)
    })

    const information = await getEnvInformationForProjectRoot(projectRoot, PID)

    expect(thrown).toBeDefined()
    expect(information.envUrl).toBeUndefined()
    expect(information.dependencies).toStrictEqual({ foo: { version: '1.0.0' } })
    expect(information.errors).toStrictEqual([{
      name: thrown?.name,
      message: thrown?.message,
      stack: thrown?.stack,
    }])

    expect(JSON.stringify(information)).not.toContain(OTHER_ENV_VAR)
  })

  it('passes an explicit maxBuffer to the ps eww call', async () => {
    exec.mockImplementation((cmd, optionsOrCallback, maybeCallback) => {
      const callback = callbackOf(optionsOrCallback, maybeCallback)

      callback(null, { stdout: cmd.startsWith('ps -eo') ? `${PID} 1\n1 0\n` : '', stderr: '' })
    })

    await getEnvInformationForProjectRoot(projectRoot, PID)

    const options = exec.mock.calls.find(([cmd]) => cmd.startsWith('ps eww'))?.[1]
    const maxBuffer = typeof options === 'object' ? options.maxBuffer : undefined

    expect(maxBuffer).toBeGreaterThan(NODE_DEFAULT_EXEC_MAX_BUFFER)
  })
})
