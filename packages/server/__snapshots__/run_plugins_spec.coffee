exports['lib/plugins/child/run_plugins sends error message if pluginsFile is missing 1'] = `Error: Cannot find module '/does/not/exist.coffee'
    at Function.Module._resolveFilename <path>module.js
    at Module._load <path>module.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>module.js
    at require <path>module.js
    at module.exports <path>run_plugins.js
    at Context.<anonymous> <path>run_plugins_spec.coffee
    at callFn <path>runnable.js
    at Test.Runnable.run <path>runnable.js
    at Runner.runTest <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at done <path>runnable.js
    at callFn <path>runnable.js
    at Hook.Runnable.run <path>runnable.js
    at next <path>runner.js
    at Immediate.<anonymous> <path>runner.js
    at runCallback <path>timers.js
    at tryOnImmediate <path>timers.js
    at processImmediate [as _immediateCallback] <path>timers.js
`

exports['lib/plugins/child/run_plugins sends error message if requiring pluginsFile errors 1'] = `Error: error thrown by pluginsFile
    at Object.<anonymous> <path>throws_error.coffee
    at Object.<anonymous> <path>throws_error.coffee
    at Module._compile <path>module.js
    at Object.loadFile <path>register.js
    at Module.load <path>register.js
    at tryModuleLoad <path>module.js
    at Module._load <path>module.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>module.js
    at require <path>module.js
    at module.exports <path>run_plugins.js
    at Context.<anonymous> <path>run_plugins_spec.coffee
    at callFn <path>runnable.js
    at Test.Runnable.run <path>runnable.js
    at Runner.runTest <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at next <path>runner.js
    at <path>runner.js
    at done <path>runnable.js
    at callFn <path>runnable.js
    at Hook.Runnable.run <path>runnable.js
    at next <path>runner.js
    at Immediate.<anonymous> <path>runner.js
    at runCallback <path>timers.js
    at tryOnImmediate <path>timers.js
    at processImmediate [as _immediateCallback] <path>timers.js
`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile has syntax error 1'] = `<path>syntax_error.coffee) error: missing }
<color-code>{<color-code>
<color-code>^<color-code>`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile does not export a function 1'] = `null`

exports['lib/plugins/child/run_plugins on \'load\' message sends error if pluginsFile function throws an error 1'] = {
  "name": "ReferenceError",
  "message": "foo is not defined"
}
