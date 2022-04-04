const os = require('os')
const { execSync } = require('child_process')

if (os.platform() === 'win32') {
  if (process.env.CI) {
    execSync('patch-package && yarn clean && gulp postinstall', {
      stdio: 'inherit',
    })
  } else {
    execSync('patch-package && yarn-deduplicate --strategy=highest && yarn clean && gulp postinstall && yarn build', {
      stdio: 'inherit',
    })
  }
} else {
  execSync('patch-package && ./scripts/run-if-not-ci.sh yarn-deduplicate --strategy=highest && yarn clean && gulp postinstall && ./scripts/run-if-not-ci.sh yarn build', {
    stdio: 'inherit',
  })
}
