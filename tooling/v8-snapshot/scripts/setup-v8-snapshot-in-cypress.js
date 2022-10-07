const { setupV8Snapshots } = require('../dist/setup')

process.env.DEBUG = process.env.DEBUG ?? 'cypress:snapgen:info'

if (!['1', 'true'].includes(process.env.DISABLE_SNAPSHOT_REQUIRE)) {
  setupV8Snapshots()
}
