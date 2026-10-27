// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read by globals.js once blueprint.ts concatenates the two
/* globals globalFunctionTrampoline, __pathResolver */

/**
 * Replaces globals that have been stubbed during snapshot creation with the
 * instances that are present in the app on startup.
 */

(function () {
  let numberOfSetGlobalsCalls = 0

  return function setGlobals (
    newGlobal,
    newProcess,
    newWindow,
    newDocument,
    newConsole,
    newPathResolver,
    nodeRequire,
  ) {
    if (numberOfSetGlobalsCalls > 0) {
      throw new Error('setGlobals should only be called once')
    }

    numberOfSetGlobalsCalls++

    // Populate the global function trampoline with the real global functions defined on newGlobal.
    globalFunctionTrampoline = newGlobal

    for (const key of Object.keys(global)) {
      newGlobal[key] = global[key]
    }

    global = newGlobal

    if (typeof newProcess !== 'undefined') {
      for (const key of Object.keys(process)) {
        newProcess[key] = process[key]
      }
    }

    process = newProcess

    if (typeof newWindow !== 'undefined') {
      for (const key of Object.keys(window)) {
        newWindow[key] = window[key]
      }
    }

    window = newWindow

    if (typeof newDocument !== 'undefined') {
      for (const key of Object.keys(document)) {
        newDocument[key] = document[key]
      }
    }

    document = newDocument

    for (const key of Object.keys(console)) {
    // eslint-disable-next-line no-console
      newConsole[key] = console[key]
    }

    console = newConsole
    __pathResolver = newPathResolver
    require = nodeRequire

    if (typeof integrityCheck === 'function') {
      // eslint-disable-next-line no-undef
      integrityCheck({ require, pathResolver: __pathResolver })
    }
  }
})()
