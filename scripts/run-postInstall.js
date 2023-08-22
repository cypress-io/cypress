const { execSync } = require('child_process')

const executionEnv = process.env.CI ? 'ci' : 'local'

const postInstallCommands = {
  local: 'patch-package && yarn-deduplicate --strategy=highest && yarn build && yarn build-v8-snapshot-dev',
  ci: 'patch-package && yarn build && V8_SNAPSHOT_DISABLE_MINIFY=1 yarn build-v8-snapshot-prod',
}

execSync(postInstallCommands[executionEnv], {
  stdio: 'inherit',
})
