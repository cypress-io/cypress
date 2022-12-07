const { execSync } = require('child_process')

const executionEnv = process.env.CI ? 'ci' : 'local'

const postInstallCommands = {
  local: 'patch-package && yarn-deduplicate --strategy=highest && yarn clean && gulp generateStaticAssets && yarn build && yarn build-v8-snapshot-dev',
  // ci: 'patch-package && gulp postinstall && yarn build && yarn build-v8-snapshot-prod',
  ci: 'patch-package && gulp generateStaticAssets && yarn build',
  // ci: 'patch-package && yarn clean && gulp generateStaticAssets',
}

execSync(postInstallCommands[executionEnv], {
  stdio: 'inherit',
})
