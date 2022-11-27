const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

function read ({ file, baseDirectory }) {
  const pathToFile = require.resolve(`./${file}`)
  const fileSource = fs.readFileSync(pathToFile, 'utf8')
  const secret = require('crypto').randomBytes(48).toString('hex')

  const mainIndexHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './index.js'), 'utf8')).digest('hex')
  const bytenodeHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './node_modules/bytenode/lib/index.js'), 'utf8')).digest('hex')
  const indexJscHash = crypto.createHmac('md5', secret).update(fs.readFileSync(path.join(baseDirectory, './packages/server/index.jsc'), 'utf8')).digest('hex')

  return fileSource.split('\n').join(`\n  `)
  .replaceAll('MAIN_INDEX_HASH', mainIndexHash)
  .replaceAll('BYTENODE_HASH', bytenodeHash)
  .replaceAll('INDEX_JSC_HASH', indexJscHash)
  .replaceAll('HMAC_SECRET', secret)
}

const getIntegrityCheckSource = (baseDirectory) => {
  return read({ part: 'binary-integrity-check-source.js', baseDirectory })
}

module.exports = {
  getIntegrityCheckSource,
}
