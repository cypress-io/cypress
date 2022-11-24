const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

function read ({ part, baseDirectory }) {
  const p = require.resolve(`./${part}`)
  const s = fs.readFileSync(p, 'utf8')

  const mainIndexHash = crypto.createHash('md5').update(fs.readFileSync(path.join(baseDirectory, './index.js'), 'utf8')).digest('hex')
  const bytenodeHash = crypto.createHash('md5').update(fs.readFileSync(path.join(baseDirectory, './node_modules/bytenode/lib/index.js'), 'utf8')).digest('hex')
  const indexJscHash = crypto.createHash('md5').update(fs.readFileSync(path.join(baseDirectory, './packages/server/index.jsc'), 'utf8')).digest('hex')

  return s.split('\n').join(`\n  `).replace('MAIN_INDEX_HASH', mainIndexHash).replace('BYTENODE_HASH', bytenodeHash).replace('INDEX_JSC_HASH', indexJscHash)
}

const getIntegrityCheckSource = (baseDirectory) => {
  return read({ part: 'binary-integrity-check-source.js', baseDirectory })
}

module.exports = {
  getIntegrityCheckSource,
}
