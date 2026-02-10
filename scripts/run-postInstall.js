const { execSync } = require('child_process')

if (process.env.SKIP_POSTINSTALL) {
  console.log('Skipping postinstall')
  process.exit(0)
}

const executionEnv = process.env.CI ? 'ci' : 'local'

const postInstallCommands = {
  local: 'patch-package && yarn-deduplicate --strategy=highest && lerna run rebuild-better-sqlite3 --scope @packages/server && yarn build && yarn build-v8-snapshot-dev',
  ci: 'patch-package && lerna run rebuild-better-sqlite3 --scope @packages/server',
}

execSync(postInstallCommands[executionEnv], {
  stdio: 'inherit',
})
