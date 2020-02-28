const fs = require('fs-extra')
const glob = require('glob')
const Promise = require('bluebird')

const globAsync = Promise.promisify(glob)

const endingNewLines = /\s+$/g
const contentBetweenBackticksRe = /\`([\s\S]+?)\`/g

globAsync('packages/server/__snapshots__/*')
.map((file) => {
  return fs.readFile(file, 'utf8')
  .then((str) => {
    return str
    .replace(
      contentBetweenBackticksRe,
      '`\n$1\n`',
    )
    .split('`\n\n\n').join('`\n\n')
    .split('\n\n\n\n`').join('\n\n\n`')
    .split(endingNewLines).join('\n')
  })
  .then((str) => {
    return fs.writeFile(file, str)
  })
})
