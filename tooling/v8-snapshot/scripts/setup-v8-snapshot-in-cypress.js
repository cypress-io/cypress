const { setupV8Snapshots } = require('../dist/setup')

process.env.DEBUG = process.env.DEBUG ?? 'cypress:snapgen:info'

if (process.env.DISABLE_SNAPSHOT_REQUIRE == null) {
  setupV8Snapshots()
}
