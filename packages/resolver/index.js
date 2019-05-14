const path = require('path')

const pkgNameRe = /@packages\/(\w+)\/(.+)/

const resolve = (pathWithPkg) => {
  throw new Error('sdf')
  const match = pkgNameRe.exec(pathWithPkg)

  if (!match) {
    throw new Error(`Path to package does not match "@packages/[pkg]/*": ${pathWithPkg}`)
  }

  return (
    path.join(
      path.dirname(
        require.resolve(`@packages/${match[1]}`)
      )
      , match[2]
    )
  )

}

module.exports = {

  resolve,

  require (pathWithPkg) {
    return require(resolve(pathWithPkg))
  },
}
