import execa from 'execa'
import cp from 'child_process'
import Bluebird from 'bluebird'

// export an object for easy method stubbing
export const utils = {
  execa,
  getOutput: (cmd: string, args: string[]): Bluebird<{ stdout: string, stderr?: string }> => {
    if (process.platform === 'win32') {
      // execa has better support for windows spawning conventions
      throw new Error('getOutput should not be used on Windows - use execa instead')
    }

    return new Bluebird((resolve, reject) => {
      let stdout = ''
      let stderr = ''

      const proc = cp.spawn(cmd, args)

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
