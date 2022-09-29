process.env.DEBUG = process.env.DEBUG || 'cypress:snapgen:info'

if (process.env.DISABLE_SNAPSHOT_REQUIRE == null) {
  const { setupV8Snapshots } = require('../dist/setup')

  setupV8Snapshots()
}
