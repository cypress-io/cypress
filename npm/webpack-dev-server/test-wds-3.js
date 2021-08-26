const execa = require('execa')
const pkg = require('./package.json')
const fs = require('fs')

/**
 * This file installs WebpackDevServer 3 and runs the tests for the dev-server.
 * We read package.json, update the webpack version, then re-run yarn install.
 * After it finishes, pass or fail,
 * we revert the package.json back to the original state.
 *
 * The tests for the example projects (inside of examples) run with WebpackDevServer 3.
 * This ensures we have some coverage for both versions.
 */
const main = async () => {
  const originalPkg = JSON.stringify(pkg, null, 2)

  const resetPkg = async () => {
    fs.writeFileSync('package.json', originalPkg, 'utf8')
    await execa('yarn', ['install'], { stdio: 'inherit' })
  }

  const checkExit = async ({ exitCode }) => {
    if (typeof exitCode !== 'number') {
      // eslint-disable-next-line no-console
      console.error(`Finished with missing exit code from execa (received ${exitCode})`)
    }

    await resetPkg()
    process.exit(exitCode)
  }

  pkg.devDependencies['webpack-dev-server'] = '^3.11.0'
  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-dev-server]: updating package.json...')
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))

  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-dev-server]: install dependencies...')
  await execa('yarn', ['install'], { stdio: 'inherit' })

  const { exitCode } = await execa('yarn', ['test-all'], { stdio: 'inherit' })

  await checkExit({ exitCode })
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
