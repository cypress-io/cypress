const { execSync } = require('child_process')

const executionEnv = process.env.CI ? 'ci' : 'local'

const postInstallCommands = {
  local: 'patch-package && yarn-deduplicate --strategy=highest && yarn clean && gulp postinstall && yarn build && ./packages/snapshot/scripts/setup-prod',
  ci: 'patch-package && yarn clean && gulp postinstall',
}

execSync(postInstallCommands[executionEnv], {
  stdio: 'inherit',
})
