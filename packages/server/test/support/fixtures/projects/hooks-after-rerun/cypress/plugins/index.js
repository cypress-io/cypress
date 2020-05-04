/// <reference types="cypress" />

const state = {}

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on) => {
  on('task', {
    incrState (arg) {
      state[arg] = state[arg] + 1 || 1

      return null
    },
    getState () {
      return state
    },
  })

  on('before:browser:launch', (browser, launchOptions) => {
    // this is needed to ensure correct error screenshot / video recording
    // resolution of exactly 1280x720 (height must account for url bar)
    if (browser.family === 'chromium') {
      if (process.env.DISPLAY === ':99') {
        launchOptions.args.push('--window-size=1280,792')
      } else {
        launchOptions.args.push('--window-size=1288,805')
      }
    } else if (browser.family === 'firefox') {
      launchOptions.args.push('-width', '1280', '-height', '794')
    }

    return launchOptions
  })
}
