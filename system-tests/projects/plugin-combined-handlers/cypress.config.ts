/* eslint-disable no-console */
import path from 'path'

const replacementPath = path.join(__dirname, 'screenshot-replacement.png')

export default {
  fixturesFolder: false,
  e2e: {
    supportFile: false,
    setupNodeEvents (on) {
      for (const event of ['before:run', 'before:spec', 'after:spec', 'after:run']) {
        on(event, () => console.log(`${event} handler 1`))
        on(event, () => console.log(`${event} handler 2`))
      }

      on('before:browser:launch', (browser, launchOptions) => {
        launchOptions.preferences.backgroundColor = '#1b1e2e'

        return launchOptions
      })

      on('before:browser:launch', (browser, launchOptions) => {
        console.log(`before:browser:launch handler 2 received preferences from handler 1: ${launchOptions.preferences.backgroundColor}`)

        return launchOptions
      })

      on('after:screenshot', () => {
        return { path: replacementPath }
      })

      on('after:screenshot', (details) => {
        console.log(`after:screenshot handler 2 received path from handler 1: ${path.basename(details.path)}`)
      })
    },
  },
}
