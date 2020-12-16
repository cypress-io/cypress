const fs = require('fs')
const glob = require('glob')
const minimist = require('minimist')
const path = require('path')

const args = minimist(process.argv.slice(2))

const packages = glob.sync('*/', {
  cwd: path.join(process.cwd(), 'packages'),
})
.map((str) => {
  return str.replace('/', '\\/')
})
.join('|')

const pattern = `(\'|")(.*\\.\\.\\/)(${packages})`

const re = new RegExp(pattern, 'g')

const text = fs.readFileSync(args.file, 'utf8')

const replacedText = text.replace(re, '$1@packages/$3')

fs.writeFileSync(args.file, replacedText)
