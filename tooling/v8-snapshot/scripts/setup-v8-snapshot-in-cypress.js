process.env.DEBUG = process.env.DEBUG || 'cypress:snapgen:info,cypress:mksnapshot:*'

if (process.env.DISABLE_SNAPSHOT_REQUIRE == null) {
  const { setupV8Snapshots } = require('../dist/setup')

  setupV8Snapshots()
}
