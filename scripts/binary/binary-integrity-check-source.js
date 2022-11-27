const origError = Error

// eslint-disable-next-line no-unused-vars
function stackIntegrityCheck (options) {
  const originalStackTrace = origError.prepareStackTrace

  origError.prepareStackTrace = function (_, stack) {
    return stack
  }

  const tempError = new origError

  origError.captureStackTrace(tempError, arguments.callee)
  let stack = tempError.stack

  origError.prepareStackTrace = originalStackTrace

  options.stackToMatch.forEach((functionName, index) => {
    if (stack[index].getFunctionName() !== functionName || !['evalmachine.<anonymous>', '<embedded>'].includes(stack[index].getFileName())) {
      throw new Error(`Integrity check failed at index ${ index } with function name ${ functionName } and expected function name ${stack[index].getFunctionName()} from ${stack[index].getFileName()}`)
    }
  })
}

// eslint-disable-next-line no-unused-vars
function fileIntegrityCheck (options) {
  const fs = options.require('fs')
  const crypto = options.require('crypto')

  // eslint-disable-next-line no-undef
  const mainIndexHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(options.pathResolver.resolve('./index.js'), 'utf8')).digest('hex')

  if (mainIndexHash !== 'MAIN_INDEX_HASH') {
    throw new Error(`Integrity check failed for main index.js file`)
  }

  // eslint-disable-next-line no-undef
  const bytenodeHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(options.pathResolver.resolve('./node_modules/bytenode/lib/index.js'), 'utf8')).digest('hex')

  if (bytenodeHash !== 'BYTENODE_HASH') {
    throw new Error(`Integrity check failed for main bytenode.js file`)
  }

  // eslint-disable-next-line no-undef
  const indexJscHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(options.pathResolver.resolve('./packages/server/index.jsc'), 'utf8')).digest('hex')

  if (indexJscHash !== 'INDEX_JSC_HASH') {
    throw new Error(`Integrity check failed for main server index.jsc file`)
  }
}
