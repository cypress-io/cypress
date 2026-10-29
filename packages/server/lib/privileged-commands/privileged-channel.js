(({ browserFamily, isSpecBridge, key, namespace, scripts, url, win = window, documentDomainContext }) => {
  /**
   * This file is read as a string in the server and injected into the spec
   * frame in order to create a privileged channel between the server and
   * the spec frame. The values above are provided by the server, with the
   * `key` being particularly important since it is used to validate
   * any messages sent from this channel back to the server.
   *
   * This file does not get preprocessed, so it should not contain syntax that
   * our minimum supported browsers do not support.
   */

  const Err = win.Error
  const captureStackTrace = win.Error.captureStackTrace
  const filter = win.Array.prototype.filter
  const arrayIncludes = win.Array.prototype.includes
  const stringIncludes = win.String.prototype.includes
  const replace = win.String.prototype.replace
  const split = win.String.prototype.split
  const decodeUri = win.decodeURIComponent
  const fetch = win.fetch
  const parse = win.JSON.parse
  const stringify = win.JSON.stringify
  const Uint8ArrayCtor = win.Uint8Array
  const Uint32ArrayCtor = win.Uint32Array
  const textEncoder = new win.TextEncoder()
  const encodeText = win.TextEncoder.prototype.encode
  const subtle = win.isSecureContext && win.crypto ? win.crypto.subtle : undefined
  const digest = subtle ? subtle.digest : undefined

  const queryStringRegex = /\?.*$/

  let hasValidCallbackContext = false

  // since this function is eval'd, the scripts are included as stringified JSON
  if (scripts) {
    scripts = parse(scripts)
  }

  // when privileged commands are called within the cy.origin() callback,
  // since the callback is eval'd in the spec bridge instead of being run
  // directly in the spec frame, we need to use different criteria, namely
  // that the stack includes the function where we eval the callback
  const hasSpecBridgeInvocation = (err) => {
    switch (browserFamily) {
      case 'chromium':
        return stringIncludes.call(err.stack, 'at invokeOriginFn')
      case 'firefox':
        return stringIncludes.call(err.stack, 'invokeOriginFn@')
      // currently, this won't run in webkit since it doesn't
      // support cy.origin()
      default:
        return false
    }
  }

  // in chromium when using the older document.domain injection, stacks only include
  // lines from the frame where the error is created, so to validate a function call
  // was from the spec frame, we strip message lines and any eval calls (since they
  // could be invoked from outside the spec frame) and if there are lines left, they
  // must have been from the spec frame itself
  const hasSpecFrameStackLines = (err) => {
    const stackLines = split.call(err.stack, '\n')
    const filteredLines = filter.call(stackLines, (line) => {
      return (
        !stringIncludes.call(line, err.message)
        && !stringIncludes.call(line, 'eval at <anonymous>')
      )
    })

    return filteredLines.length > 0
  }

  const isInCallback = (err) => {
    return stringIncludes.call(err.stack, 'thenFn@') || stringIncludes.call(err.stack, 'withinFn@')
  }

  const hasCallbackInsideEval = (err) => {
    if (browserFamily === 'webkit') {
      return isInCallback(err) && hasValidCallbackContext
    }

    return isInCallback(err) && stringIncludes.call(err.stack, '> eval line')
  }

  // in non-chromium browsers, and chromium in non-document domain contexts, the stack will include
  // either the spec file url or the support file
  const hasStackLinesFromSpecOrSupportFile = (err) => {
    const filteredLines = filter.call(scripts, (script) => {
      // in webkit, stack line might not include the query string
      if (browserFamily === 'webkit') {
        script = replace.call(script, queryStringRegex, '')
      }

      // stack URLs come in encoded by default (similar to URI but not entirely accurate).
      // we need to make sure our script and stack are both decoded entirely to make sure the comparisons are accurate.
      try {
        const decodedScript = decodeUri(script)

        const decodedStack = decodeUri(err.stack)

        return stringIncludes.call(decodedStack, decodedScript)
      } catch (e) {
        return false
      }
    })

    return filteredLines.length > 0
  }

  // privileged commands are commands that should only be called from the spec
  // because they escape the browser sandbox and (generally) have access to node
  const privilegedCommands = [
    'env',
    // cy.origin() doesn't directly access node, but is a pathway for other
    // commands to do so
    'origin',
    'readFile',
    // cy.selectFile() accesses node when using the path argument to read a file
    'selectFile',
    'writeFile',
    'task',
  ]

  const callbackCommands = [
    'each',
    'then',
    'within',
  ]

  function stackIsFromSpecFrame (err) {
    if (isSpecBridge) {
      return hasSpecBridgeInvocation(err)
    }

    if (browserFamily === 'chromium' && documentDomainContext) {
      return hasStackLinesFromSpecOrSupportFile(err) || hasSpecFrameStackLines(err)
    }

    return hasCallbackInsideEval(err) || hasStackLinesFromSpecOrSupportFile(err)
  }

  const SHA256_K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]

  const HEX_DIGITS = '0123456789abcdef'

  const rotateRight = (value, bits) => {
    return (value >>> bits) | (value << (32 - bits))
  }

  const toHex = (words, wordSize) => {
    let hex = ''

    for (let i = 0; i < words.length; i++) {
      for (let shift = wordSize - 4; shift >= 0; shift -= 4) {
        hex += HEX_DIGITS[(words[i] >>> shift) & 0xf]
      }
    }

    return hex
  }

  function sha256Js (bytes) {
    const byteLength = bytes.length
    const words = new Uint32ArrayCtor((((byteLength + 8) >>> 6) + 1) * 16)

    for (let i = 0; i < byteLength; i++) {
      words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
    }

    words[byteLength >>> 2] |= 0x80 << (24 - (byteLength % 4) * 8)
    words[words.length - 2] = (byteLength / 0x20000000) >>> 0
    words[words.length - 1] = byteLength << 3

    const state = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
    const schedule = new Uint32ArrayCtor(64)

    for (let offset = 0; offset < words.length; offset += 16) {
      for (let t = 0; t < 64; t++) {
        if (t < 16) {
          schedule[t] = words[offset + t]
        } else {
          const w15 = schedule[t - 15]
          const w2 = schedule[t - 2]
          const s0 = rotateRight(w15, 7) ^ rotateRight(w15, 18) ^ (w15 >>> 3)
          const s1 = rotateRight(w2, 17) ^ rotateRight(w2, 19) ^ (w2 >>> 10)

          schedule[t] = schedule[t - 16] + s0 + schedule[t - 7] + s1
        }
      }

      let a = state[0]
      let b = state[1]
      let c = state[2]
      let d = state[3]
      let e = state[4]
      let f = state[5]
      let g = state[6]
      let h = state[7]

      for (let t = 0; t < 64; t++) {
        const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
        const choice = (e & f) ^ (~e & g)
        const temp1 = (h + s1 + choice + SHA256_K[t] + schedule[t]) | 0
        const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
        const majority = (a & b) ^ (a & c) ^ (b & c)
        const temp2 = (s0 + majority) | 0

        h = g
        g = f
        f = e
        e = (d + temp1) | 0
        d = c
        c = b
        b = a
        a = (temp1 + temp2) | 0
      }

      state[0] = (state[0] + a) | 0
      state[1] = (state[1] + b) | 0
      state[2] = (state[2] + c) | 0
      state[3] = (state[3] + d) | 0
      state[4] = (state[4] + e) | 0
      state[5] = (state[5] + f) | 0
      state[6] = (state[6] + g) | 0
      state[7] = (state[7] + h) | 0
    }

    return toHex(state, 32)
  }

  // crypto.subtle is only available in secure contexts, and the spec frame is
  // served on the origin of the app under test, which may be plain http
  async function sha256 (bytes) {
    if (digest) {
      return toHex(new Uint8ArrayCtor(await digest.call(subtle, 'SHA-256', bytes)), 8)
    }

    return sha256Js(bytes)
  }

  function onCommandInvocation (command) {
    // message doesn't really matter since we're only interested in the stack
    const err = new Err('command stack error')

    // strips the stack for this function itself, so we get a more accurate
    // look at where the command was called from
    if (captureStackTrace) {
      captureStackTrace.call(Err, err, onCommandInvocation)
    }

    if (arrayIncludes.call(callbackCommands, command.name)) {
      hasValidCallbackContext = stackIsFromSpecFrame(err)
    }

    if (!arrayIncludes.call(privilegedCommands, command.name)) return

    // if stack is not validated as being from the spec frame, don't add
    // it as a verified command
    if (!stackIsFromSpecFrame(err)) return

    // the server runs a command once per verification of its options hash.
    // the options are hashed to avoid `413 Request Entity Too Large` error
    // from express. see https://github.com/cypress-io/cypress/issues/27099
    // and https://github.com/cypress-io/cypress/issues/27097
    let verifiedHash

    const verify = async (packet, binaries) => {
      const binaryHashes = []

      for (let i = 0; i < binaries.length; i++) {
        binaryHashes[i] = await sha256(binaries[i])
      }

      const hash = await sha256(encodeText.call(textEncoder, stringify([packet, binaryHashes])))

      // a retried command (e.g. cy.readFile() until its assertion passes)
      // verifies again, but only with the options it was first verified with
      if (verifiedHash === undefined) {
        verifiedHash = hash
      } else if (hash !== verifiedHash) {
        return
      }

      // needs to use the fully-qualified url or else when the baseUrl includes
      // basic auth, the fetch fails with a security error
      // see https://github.com/cypress-io/cypress/issues/28336
      return fetch(`${win.location.origin}/${namespace}/add-verified-command`, {
        body: stringify({
          hash,
          name: command.name,
          key,
          url,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }).catch(() => {
        // this erroring is unlikely, but it's fine to ignore. if adding the
        // verified command failed, the default behavior is NOT to allow
        // the privileged command to run
      })
    }

    return {
      verify,
    }
  }

  win.Cypress.on('command:invocation', onCommandInvocation)

  // returned for testing purposes only
  return {
    onCommandInvocation,
    sha256,
  }
})
