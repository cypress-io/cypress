import fs from 'fs'
import path from 'path'

const workerIndex = () => process.env.CYPRESS_WORKER_INDEX

const record = (file: string, line: string) => {
  fs.mkdirSync(path.join(__dirname, 'events'), { recursive: true })
  fs.appendFileSync(path.join(__dirname, 'events', file), `${line}\n`)
}

export default {
  e2e: {
    supportFile: false,
    video: false,
    setupNodeEvents (on) {
      on('before:run', () => record('before-run', String(workerIndex())))
      on('after:run', () => record('after-run', String(workerIndex())))
      on('task', {
        recordSpec (spec: string) {
          record('specs', `${workerIndex()} ${spec}`)

          return workerIndex() ?? null
        },
        recordRenderer (renderer: string) {
          record('renderers', `${workerIndex()} ${renderer}`)

          return null
        },
      })
    },
  },
}
