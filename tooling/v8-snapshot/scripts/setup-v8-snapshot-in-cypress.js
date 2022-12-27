process.env.DEBUG = process.env.DEBUG ?? 'cypress:snapgen:info'

const { setupV8Snapshots } = require('../dist/setup')

if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE)) {
  setupV8Snapshots({ supportCypressInCypress: true })
}
