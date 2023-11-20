import execa from 'execa'
import cp from 'child_process'
import os from 'os'
import Bluebird from 'bluebird'

// export an object for easy method stubbing
export const utils = {
  execa,
  spawnWithArch: <T extends cp.SpawnOptionsWithStdioTuple<cp.StdioNull, cp.StdioPipe, cp.StdioPipe>>(cmd: string, args: string[], opts: T) => {
    if (os.platform() === 'darwin' && os.arch() === 'arm64') {
      // On macOS, browsers are distributed as "universal apps" which have both arm64 and x86_64 binaries
      // in the same file. The OS decides which architecture to use based on heuristics. If Cypress was
      // launched from an x86_64 process on arm64 macOS (like if an x64 version of Node.js is being used),
      // even though the Cypress CLI will correctly spawn the arm64 version of Cypress, when we spawn the
      // browser macOS will decide to use the x86_64 version, not the arm64 version. This is problematic
      // because the Rosetta translation is painfully slow. To work around this, we wrap the spawn with
      // the `arch` utility, which will launch the correct architecture (arm64) if it is available in the
      // universal app, otherwise falling back to x86_64.
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
    }

    // Outside of darwin-arm64, we can rely on the OS to launch the correct architecture of the browser.
    return cp.spawn(cmd, args, opts)
  },
  getOutput: (cmd: string, args: string[]): Bluebird<{ stdout: string, stderr?: string }> => {
    if (os.platform() === 'win32') {
      // execa has better support for windows spawning conventions
      throw new Error('getOutput should not be used on Windows - use execa instead')
    }

    return new Bluebird((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      const proc = utils.spawnWithArch(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], env: process.env })

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
