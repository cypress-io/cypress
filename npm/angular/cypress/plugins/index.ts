import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin'

module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config)

  require('@cypress/code-coverage/task')(on, config)

  return config
}
