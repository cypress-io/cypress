const OrigError = Error
const captureStackTrace = Error.captureStackTrace
const toString = Function.prototype.toString
const callFn = Function.call

// eslint-disable-next-line no-unused-vars
const stackIntegrityCheck = function stackIntegrityCheck (options) {
  const originalStackTraceLimit = Error.stackTraceLimit
  const originalStackTrace = OrigError.prepareStackTrace

  Error.stackTraceLimit = Infinity

  OrigError.prepareStackTrace = function (_, stack) {
    return stack
  }

  const tempError = new OrigError

  captureStackTrace(tempError, arguments.callee)
  const stack = tempError.stack.filter((frame) => !frame.getFileName().startsWith('node:internal') && !frame.getFileName().startsWith('node:electron'))

  OrigError.prepareStackTrace = originalStackTrace
  Error.stackTraceLimit = originalStackTraceLimit

  if (stack.length !== options.stackToMatch.length) {
    throw new Error(`Integrity check failed with expected stack length ${options.stackToMatch.length} but got ${stack.length}`)
  }

  for (let index = 0; index < options.stackToMatch.length; index++) {
    const expectedFunctionName = options.stackToMatch[index].functionName
    const actualFunctionName = stack[index].getFunctionName()
    const expectedFileName = options.stackToMatch[index].fileName
    const actualFileName = stack[index].getFileName()

    if (expectedFunctionName && actualFunctionName !== expectedFunctionName) {
      throw new Error(`Integrity check failed with expected function name ${expectedFunctionName} but got ${actualFunctionName}`)
    }

    if (expectedFileName && actualFileName !== expectedFileName) {
      throw new Error(`Integrity check failed with expected file name ${expectedFileName} but got ${actualFileName}`)
    }
  }
}

function validateToString () {
  if (toString.call !== callFn) {
    throw new Error('Integrity check failed for toString.call')
  }
}

function validateElectron (electron) {
  if (toString.call(electron.app.getAppPath) !== 'function getAppPath() { [native code] }') {
    throw new Error(`Integrity check failed for electron.app.getAppPath.toString()`)
  }
}

function validateFs (fs) {
  if (toString.call(fs.readFileSync) !== `function(t,r){const n=splitPath(t);if(!n.isAsar)return g.apply(this,arguments);const{asarPath:i,filePath:a}=n,o=getOrCreateArchive(i);if(!o)throw createError("INVALID_ARCHIVE",{asarPath:i});const c=o.getFileInfo(a);if(!c)throw createError("NOT_FOUND",{asarPath:i,filePath:a});if(0===c.size)return r?"":s.Buffer.alloc(0);if(c.unpacked){const t=o.copyFileOut(a);return e.readFileSync(t,r)}if(r){if("string"==typeof r)r={encoding:r};else if("object"!=typeof r)throw new TypeError("Bad arguments")}else r={encoding:null};const{encoding:f}=r,l=s.Buffer.alloc(c.size),u=o.getFdAndValidateIntegrityLater();if(!(u>=0))throw createError("NOT_FOUND",{asarPath:i,filePath:a});return logASARAccess(i,a,c.offset),e.readSync(u,l,0,c.size,c.offset),validateBufferIntegrity(l,c.integrity),f?l.toString(f):l}`) {
    throw new Error(`Integrity check failed for fs.readFileSync.toString()`)
  }
}

function validateCrypto (crypto) {
  if (toString.call(crypto.createHmac) !== `CRYPTO_CREATE_HMAC_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.createHmac.toString()`)
  }

  if (toString.call(crypto.Hmac.prototype.update) !== `CRYPTO_HMAC_UPDATE_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.Hmac.prototype.update.toString()`)
  }

  if (toString.call(crypto.Hmac.prototype.digest) !== `CRYPTO_HMAC_DIGEST_TO_STRING`) {
    throw new Error(`Integrity check failed for crypto.Hmac.prototype.digest.toString()`)
  }
}

function validateFile ({ filePath, crypto, fs, expectedHash, errorMessage }) {
  const hash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(filePath, 'utf8')).digest('hex')

  if (hash !== expectedHash) {
    throw new Error(errorMessage)
  }
}

// eslint-disable-next-line no-unused-vars
function integrityCheck (options) {
  const require = options.require
  const electron = require('electron')
  const fs = require('fs')
  const crypto = require('crypto')

  // 1. Validate that the native functions we are using haven't been tampered with
  validateToString()
  validateElectron(electron)
  validateFs(fs)
  validateCrypto(crypto)

  const appPath = electron.app.getAppPath()

  // 2. Validate that the stack trace is what we expect
  stackIntegrityCheck({ stackToMatch:
    [
      {
        functionName: 'integrityCheck',
        fileName: '<embedded>',
      },
      {
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
        // eslint-disable-next-line no-undef
        fileName: [appPath, 'node_modules', 'bytenode', 'lib', 'index.js'].join(PATH_SEP),
      },
      {
        // eslint-disable-next-line no-undef
        fileName: [appPath, 'index.js'].join(PATH_SEP),
      },
    ],
  })

  // 3. Validate the three pieces of the entry point: the main index file, the bundled jsc file, and the bytenode node module
  validateFile({
    // eslint-disable-next-line no-undef
    filePath: [appPath, 'index.js'].join(PATH_SEP),
    crypto,
    fs,
    expectedHash: 'MAIN_INDEX_HASH',
    errorMessage: 'Error: Integrity check failed for main index.js file',
  })

  validateFile({
    // eslint-disable-next-line no-undef
    filePath: [appPath, 'node_modules', 'bytenode', 'lib', 'index.js'].join(PATH_SEP),
    crypto,
    fs,
    expectedHash: 'BYTENODE_HASH',
    errorMessage: 'Error: Integrity check failed for main bytenode.js file',
  })

  validateFile({
    // eslint-disable-next-line no-undef
    filePath: [appPath, 'packages', 'server', 'index.jsc'].join(PATH_SEP),
    crypto,
    fs,
    expectedHash: 'INDEX_JSC_HASH',
    errorMessage: 'Error: Integrity check failed for main server index.jsc file',
  })
}
