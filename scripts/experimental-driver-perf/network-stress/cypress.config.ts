import fs from 'node:fs'
import path from 'node:path'

// A plain object, not defineConfig from cypress: dev mode resolves `cypress` from the
// monorepo, and this project has no node_modules of its own
export default {
  experimentalWebKitSupport: true,
  fixturesFolder: false,
  video: false,
  e2e: {
    // the experimental driver requires baseUrl
    baseUrl: 'http://localhost:3500',
    setupNodeEvents (on, config) {
      // `cypress run` only takes an output path through the module API, so the run
      // results for performance comparisons are written here instead
      on('after:run', (results) => {
        const outFile = config.expose.perfResults

        if (!outFile) {
          return
        }

        fs.mkdirSync(path.dirname(outFile), { recursive: true })
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2))
      })

      on('task', {
        'perf:record' ({ outFile, spec, records }) {
          if (!outFile) {
            return null
          }

          fs.mkdirSync(path.dirname(outFile), { recursive: true })

          const lines = records.map((record) => JSON.stringify({ spec, ...record }))

          if (lines.length) {
            fs.appendFileSync(outFile, `${lines.join('\n')}\n`)
          }

          return null
        },
      })
    },
  },
}
