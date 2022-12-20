import execa from 'execa'
import cp from 'child_process'
import os from 'os'
import Bluebird from 'bluebird'

// export an object for easy method stubbing
export const utils = {
  execa,
  spawnWithArch: <T extends cp.SpawnOptionsWithStdioTuple<cp.StdioNull, cp.StdioPipe, cp.StdioPipe>>(cmd: string, args: string[], opts: T) => {
    if (!(os.platform() === 'darwin' && os.arch() === 'arm64')) {
      return cp.spawn(cmd, args, opts)
    }

    // when Cypress spawns processes on Apple macOS with a Intel process as Cypress's parent,
    // macOS will launch the rosetta-interpreted version (slow) by default. this wraps the
    // spawn options to prefer arm64 over x86_64 (rosetta)
    return cp.spawn(
      'arch',
      [cmd, ...args],
      {
        ...opts,
        env: {
          ARCHPREFERENCE: 'arm64,x86_64',
          ...opts.env,
        },
      } as T,
    )
  },
  getOutput: (cmd: string, args: string[]): Bluebird<{ stdout: string, stderr?: string }> => {
    if (os.platform() === 'win32') {
      // execa has better support for windows spawning conventions
      throw new Error('getOutput should not be used on Windows - use execa instead')
    }

    return new Bluebird((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      const proc = utils.spawnWithArch(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })

      const finish = () => {
        proc.kill()
        resolve({ stderr, stdout })
      }

      // the "exit" event might happen before
      // the child streams are finished, thus we use
      // the "close" event
      // https://github.com/cypress-io/cypress/issues/8611
      proc.on('close', finish)

      proc.stdout.on('data', (chunk) => {
        stdout += chunk
      })

      proc.stderr.on('data', (chunk) => {
        stderr += chunk
      })

      proc.on('error', (err) => {
        proc.kill()
        reject(err)
      })
    })
  },
}
