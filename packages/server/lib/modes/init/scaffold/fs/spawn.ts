import { spawn as nodeSpawn, SpawnOptions } from 'child_process'

export const spawn = (command: string, args?: readonly string[], options?: SpawnOptions) => {
  return new Promise((resolve, reject) => {
    const proc = nodeSpawn(command, args, options)

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(code)
      }

      resolve()
    })
  })
}
