const OrigError = Error
const captureStackTrace = Error.captureStackTrace

// eslint-disable-next-line no-unused-vars
const stackIntegrityCheck = function stackIntegrityCheck (options) {
  const originalStackTrace = OrigError.prepareStackTrace

  OrigError.prepareStackTrace = function (_, stack) {
    return stack
  }

  const tempError = new OrigError

  captureStackTrace(tempError, arguments.callee)
  const stack = tempError.stack

  OrigError.prepareStackTrace = originalStackTrace

  if (stack.length !== options.stackToMatch.length) {
    throw new Error(`Integrity check failed with expected stack length ${options.stackToMatch.length} but got ${stack.length}`)
  }

  for (let index = 0; index < options.stackToMatch.length; index++) {
    const expectedFunctionName = options.stackToMatch[index].functionName
    const actualFunctionName = stack[index].getFunctionName()
    const expectedFileName = options.stackToMatch[index].fileName
    const actualFileName = stack[index].getFileName()

    if (expectedFunctionName && !actualFunctionName.endsWith(expectedFunctionName)) {
      throw new Error(`Integrity check failed with expected function name ${expectedFunctionName} but got ${actualFunctionName}`)
    }

    if (!actualFileName.endsWith(expectedFileName)) {
      throw new Error(`Integrity check failed with expected file name ${expectedFileName} but got ${actualFileName}`)
    }
  }
}

function validateElectron (electron) {
  if (electron.app.getAppPath.toString() !== 'function getAppPath() { [native code] }') {
    throw new Error(`Integrity check failed for electron.app.getAppPath.toString()`)
  }
}

function validateFs (fs) {
  if (fs.readFileSync.toString() !== `function(t,r){const n=splitPath(t);if(!n.isAsar)return g.apply(this,arguments);const{asarPath:i,filePath:a}=n,o=getOrCreateArchive(i);if(!o)throw createError("INVALID_ARCHIVE",{asarPath:i});const c=o.getFileInfo(a);if(!c)throw createError("NOT_FOUND",{asarPath:i,filePath:a});if(0===c.size)return r?"":s.Buffer.alloc(0);if(c.unpacked){const t=o.copyFileOut(a);return e.readFileSync(t,r)}if(r){if("string"==typeof r)r={encoding:r};else if("object"!=typeof r)throw new TypeError("Bad arguments")}else r={encoding:null};const{encoding:f}=r,l=s.Buffer.alloc(c.size),u=o.getFdAndValidateIntegrityLater();if(!(u>=0))throw createError("NOT_FOUND",{asarPath:i,filePath:a});return logASARAccess(i,a,c.offset),e.readSync(u,l,0,c.size,c.offset),validateBufferIntegrity(l,c.integrity),f?l.toString(f):l}`) {
    throw new Error(`Integrity check failed for fs.readFileSync.toString()`)
  }
}

function validatePath (path) {
  if (path.join.toString() !== `PATH_JOIN_TO_STRING`) {
    throw new Error(`Integrity check failed for path.join.toString()`)
  }
}

function validateCrypto (crypto) {
  if (crypto.createHmac.toString() !== `CRYPTO_CREATE_HMAC_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.createHmac.toString()`)
  }

  if (crypto.Hmac.prototype.update.toString() !== `CRYPTO_HMAC_UPDATE_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.Hmac.prototype.update.toString()`)
  }

  if (crypto.Hmac.prototype.digest.toString() !== `CRYPTO_HMAC_DIGEST_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.Hmac.prototype.digest.toString()`)
  }
}

// eslint-disable-next-line no-unused-vars
function fileIntegrityCheck (options) {
  const require = options.require
  const electron = require('electron')
  const fs = require('fs')
  const path = require('path')
  const crypto = require('crypto')

  validateElectron(electron)
  validateFs(fs)
  validatePath(path)
  validateCrypto(crypto)

  const appPath = electron.app.getAppPath()

  stackIntegrityCheck({ stackToMatch:
    [
      {
        functionName: 'fileIntegrityCheck',
        fileName: '<embedded>',
      },
      {
        functionName: 'setGlobals',
        fileName: '<embedded>',
      },
      {
        functionName: 'snapshotRequire',
        fileName: 'evalmachine.<anonymous>',
      },
      {
        functionName: 'runWithSnapshot',
        fileName: 'evalmachine.<anonymous>',
      },
      {
        functionName: 'hookRequire',
        fileName: 'evalmachine.<anonymous>',
      },
      {
        functionName: 'run',
        fileName: 'evalmachine.<anonymous>',
      },
      {
        fileName: 'evalmachine.<anonymous>',
      },
      {
        functionName: 'Module._extensions.<computed>',
        fileName: path.join(appPath, 'node_modules', 'bytenode', 'lib', 'index.js'),
      },
      {
        fileName: path.join(appPath, 'index.js'),
      },
      {
        functionName: 'Module._compile',
        fileName: 'node:internal/modules/cjs/loader',
      },
    ],
  })

  // eslint-disable-next-line no-undef
  const mainIndexHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(path.join(appPath, 'index.js'), 'utf8')).digest('hex')

  if (mainIndexHash !== 'MAIN_INDEX_HASH') {
    throw new Error(`Integrity check failed for main index.js file`)
  }

  // eslint-disable-next-line no-undef
  const bytenodeHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(path.join(appPath, 'node_modules', 'bytenode', 'lib', 'index.js'), 'utf8')).digest('hex')

  if (bytenodeHash !== 'BYTENODE_HASH') {
    throw new Error(`Integrity check failed for main bytenode.js file`)
  }

  // eslint-disable-next-line no-undef
  const indexJscHash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(path.join(appPath, 'packages', 'server', 'index.jsc'), 'utf8')).digest('hex')

  if (indexJscHash !== 'INDEX_JSC_HASH') {
    throw new Error(`Integrity check failed for main server index.jsc file`)
  }
}
