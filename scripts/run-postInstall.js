const { execSync } = require('child_process')

const executionEnv = process.env.CI ? 'ci' : 'local'

// `electron` no longer downloads its binary on install; without it, the first `require('electron')`
// under plain Node downloads it and prints to stdout, which ends up in Cypress's run output
const postInstallCommands = {
  local: 'patch-package && install-electron && yarn workspace @packages/server sync-cloud-validations && yarn-deduplicate --strategy=highest && lerna run rebuild-better-sqlite3 --scope @packages/server && yarn build && yarn build-v8-snapshot-dev',
  ci: 'patch-package && install-electron && yarn workspace @packages/server sync-cloud-validations && lerna run rebuild-better-sqlite3 --scope @packages/server',
}

execSync(postInstallCommands[executionEnv], {
  stdio: 'inherit',
})
