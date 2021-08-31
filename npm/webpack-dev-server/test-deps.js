const execa = require('execa')
const pkg = require('./package.json')
const fs = require('fs')

/**
 * This file installs dependencies that we support but don't have coverage for.
 * We read package.json, update the dependency, then re-run yarn install.
 * After it finishes, pass or fail,
 * we revert the package.json back to the original state.
 */
const main = async () => {
  const depsToTest = [
    [
      {
        name: 'webpack-dev-server',
        version: '3.11.0',
        type: 'devDependencies',
      },
    ],
    [
      { name: 'webpack', version: '5.53.0', type: 'devDependencies' },
      {
        name: 'html-webpack-plugin',
        version: '5.3.2',
        type: 'devDependencies',
      },
    ],
  ]
  const originalPkg = JSON.stringify(pkg, null, 2)

  const exit = async (exitCode) => {
    fs.writeFileSync('package.json', originalPkg, 'utf8')
    await execa('yarn', ['install'], { stdio: 'inherit' })
    process.exit(exitCode)
  }

  for (const deps of depsToTest) {
    const pkg = JSON.parse(originalPkg)
    const depsInfo = JSON.stringify(deps)

    deps.forEach(({ type, name, version }) => (pkg[type][name] = version))

    // eslint-disable-next-line no-console
    console.log('[@cypress/webpack-dev-server]: updating package.json...')
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8')

    // eslint-disable-next-line no-console
    console.log('[@cypress/webpack-dev-server]: install dependencies...')
    await execa('yarn', ['install'], { stdio: 'inherit' })

    // eslint-disable-next-line no-console
    console.log(
      `[@cypress/webpack-dev-server]: Testing with deps: ${depsInfo}`,
    )

    const { exitCode } = await execa('yarn', ['test-all'], {
      stdio: 'inherit',
    })

    if (typeof exitCode !== 'number') {
    // eslint-disable-next-line no-console
      console.error(
        `Testing with deps: ${depsInfo} finished with missing exit code from execa (received ${exitCode})`,
      )
    }

    if (exitCode !== 0) {
      exit(exitCode)
    }
  }
  exit(0)
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
