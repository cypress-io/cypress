const { setupV8Snapshots } = require('../dist/setup')

if (process.env.DISABLE_SNAPSHOT_REQUIRE == null) {
  setupV8Snapshots()
}
