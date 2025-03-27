/* global window */
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
  const map = win.Array.prototype.map
  const slice = win.Array.prototype.slice
  const isArray = win.Array.isArray
  const stringIncludes = win.String.prototype.includes
  const replace = win.String.prototype.replace
  const split = win.String.prototype.split
  const functionToString = win.Function.prototype.toString
  const fetch = win.fetch
  const parse = win.JSON.parse
  const stringify = win.JSON.stringify
  const charCodeAt = win.String.prototype.charCodeAt
  const imul = Math.imul

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
        const decodedScript = decodeURIComponent(script)

        const decodedStack = decodeURIComponent(err.stack)

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
    'exec',
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

  // source: https://github.com/bryc/code/blob/d0dac1c607a005679799024ff66166e13601d397/jshash/experimental/cyrb53.js
  function hash (str) {
    const seed = 0
    let h1 = 0xdeadbeef ^ seed
    let h2 = 0x41c6ce57 ^ seed

    for (let i = 0, ch; i < str.length; i++) {
      ch = charCodeAt.call(str, i)
      h1 = imul(h1 ^ ch, 2654435761)
      h2 = imul(h2 ^ ch, 1597334677)
    }
    h1 = imul(h1 ^ (h1 >>> 16), 2246822507)
    h1 ^= imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = imul(h2 ^ (h2 >>> 16), 2246822507)
    h2 ^= imul(h1 ^ (h1 >>> 13), 3266489909)

    return `${4294967296 * (2097151 & h2) + (h1 >>> 0)}`
  }

  // removes trailing undefined args
  function dropRightUndefined (array) {
    if (!isArray(array)) return []

    let index = array.length

    // find index of last non-undefined arg
    // eslint-disable-next-line no-empty
    while (index-- && array[index] === undefined) {}

    return slice.call(array, 0, index + 1)
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

    // hash the args to avoid `413 Request Entity Too Large` error from express.
    // see https://github.com/cypress-io/cypress/issues/27099 and
    // https://github.com/cypress-io/cypress/issues/27097
    const args = map.call(dropRightUndefined([...(command.args || [])]), (arg) => {
      if (arg === undefined) {
        arg = null
      }

      if (typeof arg === 'function') {
        arg = functionToString.call(arg)
      }

      return hash(stringify(arg))
    })

    // if we verify a privileged command was invoked from the spec frame, we
    // send it to the server, where it's stored in state. when the command is
    // run and it sends its message to the server via websocket, we check
    // that verified status before allowing the command to continue running
    //
    // needs to use the fully-qualified url or else when the baseUrl includes
    // basic auth, the fetch fails with a security error
    // see https://github.com/cypress-io/cypress/issues/28336
    const promise = fetch(`${win.location.origin}/${namespace}/add-verified-command`, {
      body: stringify({
        args,
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

    return {
      args,
      promise,
    }
  }

  win.Cypress.on('command:invocation', onCommandInvocation)

  // returned for testing purposes only
  return {
    dropRightUndefined,
    onCommandInvocation,
  }
})
