const execa = require('execa')
const pkg = require('./package.json')
const fs = require('fs')

/**
 * This file installs Webpack 5 and runs the unit and e2e tests for the preprocessor.
 * We read package.json, update the webpack version, then re-run yarn install.
 * After it finishes, pass or fail,
 * we revert the package.json back to the original state.
 *
 * The tests for the example projects (inside of examples) run with Webpack 4.
 * This ensures we have some coverage for both versions.
 */
const main = async () => {
  const originalPkg = JSON.stringify(pkg, null, 2)

  const install = () => execa('yarn', ['install', '--ignore-scripts'], { stdio: 'inherit' })

  const resetPkg = async () => {
    fs.writeFileSync('package.json', originalPkg, 'utf8')
    await install()
  }

  const checkExit = async ({ exitCode, step }) => {
    if (typeof exitCode !== 'number') {
      // eslint-disable-next-line no-console
      console.error(`${step} finished with missing exit code from execa (received ${exitCode})`)
    }

    if (step === 'e2e' || (step === 'unit' && exitCode !== 0)) {
      await resetPkg()
      process.exit(exitCode)
    }
  }

  pkg.dependencies['webpack'] = '^5.39.0'
  delete pkg.devDependencies['@types/webpack']
  delete pkg.devDependencies['webpack']
  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-preprocessor]: updating package.json...')
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))

  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-preprocessor]: install dependencies...')
  await install()

  const unit = await execa('yarn', ['test-unit'], { stdio: 'inherit' })

  await checkExit({ exitCode: unit.exitCode, step: 'unit' })

  const e2e = await execa('yarn', ['test-e2e'], { stdio: 'inherit' })

  await checkExit({ exitCode: e2e.exitCode, step: 'e2e' })
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
