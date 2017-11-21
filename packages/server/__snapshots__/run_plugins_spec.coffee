exports['lib/plugins/child/run_plugins sends error message if pluginsFile is missing 1'] = `Error: Cannot find module '/does/not/exist.coffee'
    at Function.Module._resolveFilename (<path>)
    at Module._load (<path>)
    at Function.hookedLoader [as _load] (<path>)
    at Module.require (<path>)
    at require (<path>)
    at module.exports.err (<path>)
    at Context.<anonymous> (<path>)
    at callFn (<path>)
    at Test.Runnable.run (<path>)
    at Runner.runTest (<path>)
    at(<path>)
    at next (<path>)
    at(<path>)
    at next (<path>)
    at(<path>)
    at done (<path>)
    at callFn (<path>)
    at Hook.Runnable.run (<path>)
    at next (<path>)
    at Immediate.<anonymous> (<path>)
    at runCallback (<path>)
    at tryOnImmediate (<path>)
    at processImmediate [as _immediateCallback] (<path>)
`

exports['lib/plugins/child/run_plugins sends error message if requiring pluginsFile errors 1'] = `Error: error thrown by pluginsFile
    at Object.<anonymous> (<path>)
    at Object.<anonymous> (<path>)
    at Module._compile (<path>)
    at Object.loadFile (<path>)
    at Module.load (<path>)
    at tryModuleLoad (<path>)
    at Module._load (<path>)
    at Function.hookedLoader [as _load] (<path>)
    at Module.require (<path>)
    at require (<path>)
    at module.exports.err (<path>)
    at Context.<anonymous> (<path>)
    at callFn (<path>)
    at Test.Runnable.run (<path>)
    at Runner.runTest (<path>)
    at(<path>)
    at next (<path>)
    at(<path>)
    at next (<path>)
    at(<path>)
    at done (<path>)
    at callFn (<path>)
    at Hook.Runnable.run (<path>)
    at next (<path>)
    at Immediate.<anonymous> (<path>)
    at runCallback (<path>)
    at tryOnImmediate (<path>)
    at processImmediate [as _immediateCallback] (<path>)
`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile has syntax error 1'] = `/Users/chrisbreiding/Dev/cypress/cypress/packages/server/test/fixtures/syntax_error.coffee:1:1: error: missing }
[1;31m{[0m
[1;31m^[0m`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile does not export a function 1'] = `null`

exports['lib/plugins/child/run_plugins on \'load\' message sends error if pluginsFile function throws an error 1'] = {
  "name": "ReferenceError",
  "message": "foo is not defined"
}

