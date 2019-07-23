exports['lib/plugins/child/run_plugins sends error message if pluginsFile is missing 1'] = `
Error: Cannot find module '/does/not/exist.coffee'
Require stack:
- lib/plugins/child/run_plugins.js
- test/unit/plugins/child/run_plugins_spec.coffee
- node_modules/mocha/lib/mocha.js
- node_modules/mocha/index.js
- node_modules/mocha/bin/_mocha
    at Function.Module._resolveFilename <path>loader.js
    at Module._load <path>loader.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>loader.js
    at require <path>helpers.js
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
    at Immediate._onImmediate <path>runner.js
    at processImmediate <path>timers.js

`

exports['lib/plugins/child/run_plugins sends error message if requiring pluginsFile errors 1'] = `
Error: error thrown by pluginsFile
    at Object.<anonymous> <path>throws_error.coffee
    at Object.<anonymous> <path>throws_error.coffee
    at Module._compile <path>loader.js
    at Object.loadFile <path>register.js
    at Module.load <path>register.js
    at Module._load <path>loader.js
    at Function.hookedLoader [as _load] <path>mockery.js
    at Module.require <path>loader.js
    at require <path>helpers.js
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
    at Immediate._onImmediate <path>runner.js
    at processImmediate <path>timers.js

`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile has syntax error 1'] = `
<path>syntax_error.coffee) error: missing }
<color-code>{<color-code>
<color-code>^<color-code>
`

exports['lib/plugins/child/run_plugins sends error message if pluginsFile does not export a function 1'] = `
null
`
