import fs from 'fs'
import path from 'path'

const record = (file: string, line: string) => {
  fs.mkdirSync(path.join(__dirname, 'events'), { recursive: true })
  fs.appendFileSync(path.join(__dirname, 'events', file), `${line}\n`)
}

export default {
  e2e: {
    supportFile: false,
    video: false,
    setupNodeEvents (on, config) {
      const { workerIndex } = config

      on('before:run', () => record('before-run', String(workerIndex)))
      on('after:run', () => record('after-run', String(workerIndex)))
      on('task', {
        recordSpec (spec: string) {
          record('specs', `${workerIndex} ${spec}`)
          record('webpack', `${workerIndex} ${Object.keys(require.cache).some((file) => /[\\/]node_modules[\\/]webpack[\\/]/.test(file))}`)

          return workerIndex
        },
        recordRenderer (renderer: string) {
          record('renderers', `${workerIndex} ${renderer}`)

          return null
        },
      })
    },
  },
}
