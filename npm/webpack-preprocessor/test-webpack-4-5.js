const execa = require('execa')
const pkg = require('./package.json')
const fs = require('fs')

const checkExit = ({ exitCode, step }) => {
  if (typeof exitCode !== 'number') {
    // eslint-disable-next-line no-console
    console.error(`${step} finished with missing exit code from execa (received ${exitCode})`)
    process.exit(1)
  }

  if (step === 'unit' && exitCode !== 0) {
    process.exit(exitCode)
  }
}

const main = async () => {
  pkg.dependencies['webpack'] = '^5.39.0'
  delete pkg.devDependencies['@types/webpack']
  delete pkg.devDependencies['webpack']
  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-preprocessor]: updating package.json...')
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))

  // eslint-disable-next-line no-console
  console.log('[@cypress/webpack-preprocessor]: install dependencies...')
  await execa('yarn', ['install'], { stdio: 'inherit' })

  const unit = await execa('yarn', ['test-unit'], { stdio: 'inherit' })

  checkExit({ exitCode: unit.exitCode, step: 'unit' })

  const e2e = await execa('yarn', ['test-e2e'], { stdio: 'inherit' })

  checkExit({ exitCode: e2e.exitCode, step: 'e2e' })
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
