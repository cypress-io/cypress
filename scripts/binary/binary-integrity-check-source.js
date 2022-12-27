const OrigError = Error
const captureStackTrace = Error.captureStackTrace
const toString = Function.prototype.toString
const callFn = Function.call
const filter = Array.prototype.filter
const startsWith = String.prototype.startsWith

const integrityErrorMessage = `
We detected an issue with the integrity of the Cypress binary. It may have been modified and cannot run. We recommend re-installing the Cypress binary with:

\`cypress cache clear && cypress install\`
`

const stackIntegrityCheck = function stackIntegrityCheck (options) {
  const originalStackTraceLimit = OrigError.stackTraceLimit
  const originalPrepareStackTrace = OrigError.prepareStackTrace

  OrigError.stackTraceLimit = Infinity

  OrigError.prepareStackTrace = function (_, stack) {
    return stack
  }

  const tempError = new OrigError

  captureStackTrace(tempError, arguments.callee)
  const stack = filter.call(tempError.stack, (frame) => !startsWith.call(frame.getFileName(), 'node:internal') && !startsWith.call(frame.getFileName(), 'node:electron'))

  OrigError.prepareStackTrace = originalPrepareStackTrace
  OrigError.stackTraceLimit = originalStackTraceLimit

  if (stack.length !== options.stackToMatch.length) {
    console.error(`Integrity check failed with expected stack length ${options.stackToMatch.length} but got ${stack.length}`)
    throw new Error(integrityErrorMessage)
  }

  for (let index = 0; index < options.stackToMatch.length; index++) {
    const { functionName: expectedFunctionName, fileName: expectedFileName, line: expectedLineNumber, column: expectedColumnNumber } = options.stackToMatch[index]
    const actualFunctionName = stack[index].getFunctionName()
    const actualFileName = stack[index].getFileName()
    const actualColumnNumber = stack[index].getColumnNumber()
    const actualLineNumber = stack[index].getLineNumber()

    if (expectedFunctionName && actualFunctionName !== expectedFunctionName) {
      console.error(`Integrity check failed with expected function name ${expectedFunctionName} but got ${actualFunctionName}`)
      throw new Error(integrityErrorMessage)
    }

    if (expectedFileName && actualFileName !== expectedFileName) {
      console.error(`Integrity check failed with expected file name ${expectedFileName} but got ${actualFileName}`)
      throw new Error(integrityErrorMessage)
    }

    if (expectedLineNumber && actualLineNumber !== expectedLineNumber) {
      console.error(`Integrity check failed with expected line number ${expectedLineNumber} but got ${actualLineNumber}`)
      throw new Error(integrityErrorMessage)
    }

    if (expectedColumnNumber && actualColumnNumber !== expectedColumnNumber) {
      console.error(`Integrity check failed with expected column number ${expectedColumnNumber} but got ${actualColumnNumber}`)
      throw new Error(integrityErrorMessage)
    }
  }
}

function validateStartsWith () {
  if (startsWith.call !== callFn) {
    console.error(`Integrity check failed for startsWith.call`)
    throw new Error(integrityErrorMessage)
  }
}

function validateFilter () {
  if (filter.call !== callFn) {
    console.error(`Integrity check failed for filter.call`)
    throw new Error(integrityErrorMessage)
  }
}

function validateToString () {
  if (toString.call !== callFn) {
    console.error(`Integrity check failed for toString.call`)
    throw new Error(integrityErrorMessage)
  }
}

function validateElectron (electron) {
  // Hard coded function as this is electron code and there's not an easy way to get the function string at package time. If this fails on an updated version of electron, we'll need to update this.
  if (toString.call(electron.app.getAppPath) !== 'function getAppPath() { [native code] }') {
    console.error(`Integrity check failed for toString.call(electron.app.getAppPath)`)
    throw new Error(integrityErrorMessage)
  }
}

function validateFs (fs) {
  // Hard coded function as this is electron code and there's not an easy way to get the function string at package time. If this fails on an updated version of electron, we'll need to update this.
  if (toString.call(fs.readFileSync) !== `function(t,r){const n=splitPath(t);if(!n.isAsar)return g.apply(this,arguments);const{asarPath:i,filePath:a}=n,o=getOrCreateArchive(i);if(!o)throw createError("INVALID_ARCHIVE",{asarPath:i});const c=o.getFileInfo(a);if(!c)throw createError("NOT_FOUND",{asarPath:i,filePath:a});if(0===c.size)return r?"":s.Buffer.alloc(0);if(c.unpacked){const t=o.copyFileOut(a);return e.readFileSync(t,r)}if(r){if("string"==typeof r)r={encoding:r};else if("object"!=typeof r)throw new TypeError("Bad arguments")}else r={encoding:null};const{encoding:f}=r,l=s.Buffer.alloc(c.size),u=o.getFdAndValidateIntegrityLater();if(!(u>=0))throw createError("NOT_FOUND",{asarPath:i,filePath:a});return logASARAccess(i,a,c.offset),e.readSync(u,l,0,c.size,c.offset),validateBufferIntegrity(l,c.integrity),f?l.toString(f):l}`) {
    console.error(`Integrity check failed for toString.call(fs.readFileSync)`)
    throw new Error(integrityErrorMessage)
  }
}

function validateCrypto (crypto) {
  if (toString.call(crypto.createHmac) !== `CRYPTO_CREATE_HMAC_TO_STRING`) {
    console.error(`Integrity check failed for toString.call(crypto.createHmac)`)
    throw new Error(integrityErrorMessage)
  }

  if (toString.call(crypto.Hmac.prototype.update) !== `CRYPTO_HMAC_UPDATE_TO_STRING`) {
    console.error(`Integrity check failed for toString.call(crypto.Hmac.prototype.update)`)
    throw new Error(integrityErrorMessage)
  }

  if (toString.call(crypto.Hmac.prototype.digest) !== `CRYPTO_HMAC_DIGEST_TO_STRING`) {
    console.error(`Integrity check failed for toString.call(crypto.Hmac.prototype.digest)`)
    throw new Error(integrityErrorMessage)
  }
}

function validateFile ({ filePath, crypto, fs, expectedHash, errorMessage }) {
  const hash = crypto.createHmac('md5', 'HMAC_SECRET').update(fs.readFileSync(filePath, 'utf8')).digest('hex')

  if (hash !== expectedHash) {
    console.error(errorMessage)
    throw new Error(integrityErrorMessage)
  }
}

// eslint-disable-next-line no-unused-vars
function integrityCheck (options) {
  const require = options.require
  const electron = require('electron')
  const fs = require('fs')
  const crypto = require('crypto')

  // 1. Validate that the native functions we are using haven't been tampered with
  validateStartsWith()
  validateFilter()
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
        functionName: 'startCypress',
        fileName: 'evalmachine.<anonymous>',
      },
      {
        fileName: 'evalmachine.<anonymous>',
      },
      {
        functionName: 'v',
        // eslint-disable-next-line no-undef
        fileName: [appPath, 'index.js'].join(PATH_SEP),
        line: 1,
        column: 2573,
      },
      {
        // eslint-disable-next-line no-undef
        fileName: [appPath, 'index.js'].join(PATH_SEP),
        line: 1,
        column: 2764,
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
    errorMessage: 'Integrity check failed for main index.js file',
  })

  validateFile({
    // eslint-disable-next-line no-undef
    filePath: [appPath, 'packages', 'server', 'index.jsc'].join(PATH_SEP),
    crypto,
    fs,
    expectedHash: 'INDEX_JSC_HASH',
    errorMessage: 'Integrity check failed for main server index.jsc file',
  })
}
