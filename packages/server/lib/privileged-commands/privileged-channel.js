(({ browserFamily, isSpecBridge, key, namespace, scripts, url }) => {
  /**
   * This file is read as a string in the server, sent to the driver, and eval'd
   * in the spec frame in order to create a privileged channel between the
   * server and the spec frame. The values above are provided by the server,
   * with the `key` being particularly important since it is used to validate
   * any messages sent from this channel back to the server.
   *
   * This file does not get preprocessed, so it should not contain syntax that
   * our minimum supported browsers do not support.
   */

  /* global window */

  // TODO: add unit tests for all these
  const Err = window.Error
  const captureStackTrace = Error.captureStackTrace
  const filter = Array.prototype.filter
  const arrayIncludes = Array.prototype.includes
  const map = Array.prototype.map
  const split = String.prototype.split
  const replace = String.prototype.replace
  const stringIncludes = String.prototype.includes
  const functionToString = Function.prototype.toString
  const fetch = window.fetch
  const stringify = JSON.stringify
  const parse = JSON.parse

  const queryStringRegex = /\?.*$/

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

  // in chromium, stacks only include lines from the frame where the error is
  // created, so to validate a function call was from the spec frame, we strip
  // message lines and any eval calls (since they could be invoked from outside
  // the spec frame) and if there are lines left, they must have been from
  // the spec frame itself
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

  // in non-chromium browsers, the stack will include either the spec file url
  // or the support file
  const hasStackLinesFromSpecOrSupportFile = (err) => {
    return filter.call(scripts, (script) => {
      // in webkit, stack line might not include the query string
      if (browserFamily === 'webkit') {
        script = replace.call(script, queryStringRegex, '')
      }

      return stringIncludes.call(err.stack, script)
    }).length > 0
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

  function stackIsFromSpecFrame (err) {
    if (isSpecBridge) {
      return hasSpecBridgeInvocation(err)
    }

    if (browserFamily === 'chromium') {
      return hasSpecFrameStackLines(err)
    }

    return hasStackLinesFromSpecOrSupportFile(err)
  }

  async function onCommandInvocation (command) {
    if (!arrayIncludes.call(privilegedCommands, command.name)) return

    // message doesn't really matter since we're only interested in the stack
    const err = new Err('command stack error')

    // strips the stack for this function itself, so we get a more accurate
    // look at where the command was called from
    if (captureStackTrace) {
      captureStackTrace.call(Err, err, onCommandInvocation)
    }

    // if stack is not validated as being from the spec frame, don't add
    // it as a verified command
    if (!stackIsFromSpecFrame(err)) return

    const args = map.call([...command.args], (arg) => {
      if (typeof arg === 'function') {
        return functionToString.call(arg)
      }

      return arg
    })

    // if we verify a privileged command was invoked from the spec frame, we
    // send it to the server, where it's stored in state. when the command is
    // run and it sends its message to the server via websocket, we check
    // that verified status before allowing the command to continue running
    await fetch(`/${namespace}/add-verified-command`, {
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
  }

  window.Cypress.on('command:invocation', onCommandInvocation)
})
