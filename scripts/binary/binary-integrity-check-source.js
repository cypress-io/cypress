const origError = Error

// eslint-disable-next-line no-unused-vars
function integrityCheck (options) {
  const originalStackTrace = origError.prepareStackTrace

  origError.prepareStackTrace = function (_, stack) {
    return stack
  }

  const tempError = new origError

  origError.captureStackTrace(tempError, arguments.callee)
  let stack = tempError.stack

  origError.prepareStackTrace = originalStackTrace

  options.stackToMatch.forEach((functionName, index) => {
    if (stack[index].getFunctionName() !== functionName) {
      throw new Error(`Integrity check failed at index ${ index } with function name ${ functionName } and expected function name ${ stack[index].getFunctionName()}`)
    }
  })

  const fs = require('fs')
  const crypto = require('crypto')

  // eslint-disable-next-line no-undef
  const mainIndexHash = crypto.createHash('md5').update(fs.readFileSync(__resolve_path('./index.js'), 'utf8')).digest('hex')

  if (mainIndexHash !== 'MAIN_INDEX_HASH') {
    throw new Error(`Integrity check failed for main index.js file`)
  }

  // eslint-disable-next-line no-undef
  const bytenodeHash = crypto.createHash('md5').update(fs.readFileSync(__resolve_path('./node_modules/bytenode/lib/index.js'), 'utf8')).digest('hex')

  if (bytenodeHash !== 'BYTENODE_HASH') {
    throw new Error(`Integrity check failed for main bytenode.js file`)
  }

  // eslint-disable-next-line no-undef
  const indexJscHash = crypto.createHash('md5').update(fs.readFileSync(__resolve_path('./packages/server/index.jsc'), 'utf8')).digest('hex')

  if (indexJscHash !== 'INDEX_JSC_HASH') {
    throw new Error(`Integrity check failed for main server index.jsc file`)
  }
}
