/* eslint-disable no-console */
const fs = require('fs')
const execa = require('execa')

async function main () {
  try {
    const pkg = require('./package.json')

    console.log('Adding @angular/cli to package.json')
    pkg['devDependencies']['@angular/cli'] = '13.1.4'
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))

    console.log('Running yarn install')
    await execa('yarn', ['install'], { stdout: 'inherit' })
  } catch (e) {
    if (e.stdout) {
      console.error(e.stdout)
    }

    const exitCode = e.exitCode ? e.exitCode : 1

    console.error(`Failed to add @angular/cli with exit code ${exitCode}`)
    process.exit(exitCode)
  }
}

// execute main function if called from command line
if (require.main === module) {
  main()
}
