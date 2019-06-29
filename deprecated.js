#!/usr/bin/env node

const chalk = require('chalk').default
const name = require('./package.json').name
const yargs = require('yargs')

const argv = yargs.string(['renamed', 'message']).argv

const printNotice = ({
  renamed,
  message
}) => {
  console.log(chalk.bold(`${chalk.bgBlack('WARNING')} [${chalk.yellow(name)}]: This package is deprecated.`))
  if (renamed) {
    console.log(chalk.bold(`Please uninstall this package and install ${chalk.yellow(renamed)} instead: 
    ${chalk.yellow(`
    npm remove ${name}
    npm i -D ${renamed}
    `)}`))
  }

  if (message) {
    console.log(chalk.bold(message))
  }
}


printNotice({
  renamed: argv.renamed,
  message: argv.message
})
